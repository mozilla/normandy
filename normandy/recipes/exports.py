import logging

import kinto_http
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from normandy.base.utils import ScopedSettings


APPROVE_CHANGES_FLAG = {"status": "to-sign"}
ROLLBACK_CHANGES_FLAG = {"status": "to-rollback"}
logger = logging.getLogger(__name__)
rs_settings = ScopedSettings("REMOTE_SETTINGS_")


def recipe_as_record(recipe):
    """
    Transform a recipe to a dict with the minimum amount of fields needed for clients
    to verify and execute recipes.

    :param recipe: a recipe ready to be exported.
    :returns: a dict to be posted on Remote Settings.
    """
    from normandy.recipes.api.v1.serializers import (
        MinimalRecipeSerializer,
        SignatureSerializer,
    )  # avoid circular imports

    record = {
        "id": str(recipe.id),
        "recipe": MinimalRecipeSerializer(recipe).data,
        "signature": SignatureSerializer(recipe.signature).data,
    }
    return record


class RemoteSettings:
    """
    Interacts with a RemoteSettings service.

    Recipes get published as records in one or both of the dedicated
    collections on Remote Settings. When disabled, those records are removed.

    Since Normandy already has the required approval/signoff features, the integration
    bypasses the one of Remote Settings (leveraging a specific server configuration for this
    particular collection).

    There are two collections used. One is the "baseline" collection, which
    is used only for recipes that fit within the baseline capabilities, and
    are therefore compatible with a broad range of clients. The second is the
    "capabilities" collection, in which all recipes are published. Clients
    that read from the capabilities collection are expected to process
    capabilities and only execute compatible recipes.

    .. notes::

        Remote Settings signoff workflow relies on several buckets (see kinto-signer API).

        The ``main-workspace`` is only readable and writable by authorized accounts.
        The ``main`` bucket is read-only, but publicly readable. The Remote Settings
        clients pull data from there.

        Since the review step is disabled for Normandy, publishing data is done in two steps:

        1. Create, update or delete records in the ``main-workspace`` bucket
        2. Approve the changes by flipping the ``status`` field to ``to-sign``
           in the collection metadata
        3. The server will sign and publish the new data to the ``main`` bucket.

    """

    def __init__(self):
        # Kinto is the underlying implementation of Remote Settings. The client
        # is basically a tiny abstraction on top of the requests library.
        self.client = (
            kinto_http.Client(
                server_url=rs_settings.URL,
                auth=(rs_settings.USERNAME, rs_settings.PASSWORD),
                retry=rs_settings.RETRY_REQUESTS,
            )
            if rs_settings.URL
            else None
        )

    def check_config(self):
        """
        Verify that integration with Remote Settings is configured properly.
        """
        if self.client is None:
            return  # no check if disabled.

        required_keys = [
            "BASELINE_COLLECTION_ID",
            "CAPABILITIES_COLLECTION_ID",
            "WORKSPACE_BUCKET_ID",
            "PUBLISH_BUCKET_ID",
            "USERNAME",
            "PASSWORD",
        ]
        for key in required_keys:
            if not getattr(settings, f"REMOTE_SETTINGS_{key}"):
                msg = f"set settings.REMOTE_SETTINGS_{key} to use Remote Settings integration"
                raise ImproperlyConfigured(msg)

        # Test authentication.
        server_info = self.client.server_info()
        is_authenticated = (
            "user" in server_info and rs_settings.USERNAME in server_info["user"]["id"]
        )
        if not is_authenticated:
            raise ImproperlyConfigured("Invalid Remote Settings credentials")

        # Test that collection is writable.
        bucket_collection_pairs = [
            (rs_settings.WORKSPACE_BUCKET_ID, rs_settings.BASELINE_COLLECTION_ID),
            (rs_settings.WORKSPACE_BUCKET_ID, rs_settings.CAPABILITIES_COLLECTION_ID),
        ]
        for bucket, collection in bucket_collection_pairs:
            metadata = self.client.get_collection(id=collection, bucket=bucket)
            if server_info["user"]["id"] not in metadata["permissions"].get("write", []):
                raise ImproperlyConfigured(
                    f"Remote Settings collection {collection} is not writable in bucket {bucket}."
                )

        # Test that collection has the proper review settings.
        capabilities = server_info["capabilities"]
        if "signer" in capabilities:
            for collection in [
                rs_settings.BASELINE_COLLECTION_ID,
                rs_settings.CAPABILITIES_COLLECTION_ID,
            ]:
                signer_config = capabilities["signer"]

                # Since we use the rollback feature, make sure it's available.
                if signer_config["version"] < "5.1.0":
                    raise ImproperlyConfigured("kinto-signer 5.1.0+ is required")

                normandy_resource = [
                    r
                    for r in signer_config["resources"]
                    if r["source"]["bucket"] == rs_settings.WORKSPACE_BUCKET_ID
                    and r["source"]["collection"] == collection
                ]
                review_disabled = (
                    len(normandy_resource) == 1
                    and not normandy_resource[0].get(
                        "to_review_enabled", signer_config["to_review_enabled"]
                    )
                    and not normandy_resource[0].get(
                        "group_check_enabled", signer_config["group_check_enabled"]
                    )
                )
                if not review_disabled:
                    raise ImproperlyConfigured(
                        f"Review was not disabled on Remote Settings collection {collection}."
                    )

    def published_recipes(self):
        """
        Return the current list of remote records.
        """
        if self.client is None:
            raise ImproperlyConfigured("Remote Settings is not enabled.")

        capabilities_records = self.client.get_records(
            bucket=rs_settings.PUBLISH_BUCKET_ID, collection=rs_settings.CAPABILITIES_COLLECTION_ID
        )
        baseline_records = self.client.get_records(
            bucket=rs_settings.PUBLISH_BUCKET_ID, collection=rs_settings.BASELINE_COLLECTION_ID
        )

        capabilities_ids = set(r["id"] for r in capabilities_records)
        baseline_ids = set(r["id"] for r in baseline_records)

        # All baseline records *should* be present in the capabilities
        # collection too. If not, that's concerning.
        only_baseline_ids = baseline_ids - capabilities_ids
        if only_baseline_ids:
            logging.warn(
                f"{len(only_baseline_ids)} records were found in the baseline collection "
                f"that were not in the capabilities."
            )
            # Merge the list of records by id.
            records_by_id = {}
            for record in capabilities_records + baseline_records:
                if record["id"] not in records_by_id:
                    records_by_id[record["id"]] = record

            records = records_by_id.values()
        else:
            # All records in baseline_records are also in capabilities_records,
            # so just use the ones from capabilities
            records = capabilities_records

        return records

    def publish(self, recipe, approve_changes=True):
        """
        Publish the specified `recipe` on the remote server by upserting a record.
        """
        if self.client is None:
            return  # no-op if disabled.

        baseline = False

        # 1. Put the record.
        record = recipe_as_record(recipe)
        self.client.update_record(
            data=record,
            bucket=rs_settings.WORKSPACE_BUCKET_ID,
            collection=rs_settings.CAPABILITIES_COLLECTION_ID,
        )
        if recipe.approved_revision.uses_only_baseline_capabilities():
            baseline = True
            self.client.update_record(
                data=record,
                bucket=rs_settings.WORKSPACE_BUCKET_ID,
                collection=rs_settings.BASELINE_COLLECTION_ID,
            )

        # 2. Approve the changes immediately (multi-signoff is disabled).
        log_action = "Batch published"
        if approve_changes:
            self.approve_changes(baseline)
            log_action = "Published"

        logger.info(
            f"{log_action} record '{recipe.id}' for recipe {recipe.approved_revision.name!r}"
        )

    def unpublish(self, recipe, approve_changes=True):
        """
        Unpublish the specified `recipe` by deleted its associated record on the remote server.
        """
        if self.client is None:
            return  # no-op if disabled.

        # 1. Delete the record from both baseline and capabilities collections
        either_existed = False
        baseline = False

        try:
            self.client.delete_record(
                id=str(recipe.id),
                bucket=rs_settings.WORKSPACE_BUCKET_ID,
                collection=rs_settings.CAPABILITIES_COLLECTION_ID,
            )
            either_existed = True
        except kinto_http.KintoException as e:
            if e.response.status_code == 404:
                logger.warning(
                    f"The recipe '{recipe.id}' was not published in the capabilities collection. Skip."
                )
            else:
                raise

        try:
            self.client.delete_record(
                id=str(recipe.id),
                bucket=rs_settings.WORKSPACE_BUCKET_ID,
                collection=rs_settings.BASELINE_COLLECTION_ID,
            )
            either_existed = True
            baseline = True
        except kinto_http.KintoException as e:
            if e.response.status_code == 404:
                logger.warning(
                    f"The recipe '{recipe.id}' was not published in the baseline collection. Skip."
                )
            else:
                raise

        # 2. Approve the changes immediately (multi-signoff is disabled).
        log_action = "Batch deleted"
        if either_existed and approve_changes:
            self.approve_changes(baseline)
            log_action = "Deleted"

        logger.info(
            f"{log_action} record '{recipe.id}' of recipe {recipe.approved_revision.name!r}"
        )

    def approve_changes(self, baseline=True):
        """
        Approve the changes made in the workspace collection.

        .. note::
            This only works because multi-signoff is disabled for the Normandy recipes
            in configuration (see :ref:`remote-settings-install`)
        """
        if self.client is None:
            return  # no-op if disabled.

        try:
            self.client.patch_collection(
                id=rs_settings.CAPABILITIES_COLLECTION_ID,
                data=APPROVE_CHANGES_FLAG,
                bucket=rs_settings.WORKSPACE_BUCKET_ID,
            )
            if baseline:
                self.client.patch_collection(
                    id=rs_settings.BASELINE_COLLECTION_ID,
                    data=APPROVE_CHANGES_FLAG,
                    bucket=rs_settings.WORKSPACE_BUCKET_ID,
                )

            logger.info("Changes were approved.")

        except kinto_http.exceptions.KintoException:
            # Approval failed unexpectedly.
            # The changes in the `main-workspace` bucket must be reverted.
            self.client.patch_collection(
                id=rs_settings.CAPABILITIES_COLLECTION_ID,
                data=ROLLBACK_CHANGES_FLAG,
                bucket=rs_settings.WORKSPACE_BUCKET_ID,
            )
            if baseline:
                self.client.patch_collection(
                    id=rs_settings.BASELINE_COLLECTION_ID,
                    data=ROLLBACK_CHANGES_FLAG,
                    bucket=rs_settings.WORKSPACE_BUCKET_ID,
                )

            raise
