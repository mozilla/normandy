import logging

import kinto_http
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger(__name__)


APPROVE_CHANGES_FLAG = {"status": "to-sign"}


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


def records_equal(a, b):
    """Compare records, ignoring timestamps and collection schema version.

    :param a: one record
    :param b: another record
    :returns: True if both are equal.
    """
    ignored_fields = ("last_modified", "schema")
    ra = {k: v for k, v in a.items() if k not in ignored_fields}
    rb = {k: v for k, v in b.items() if k not in ignored_fields}
    return ra == rb


class RemoteSettings:
    """
    Interacts with a RemoteSettings service.

    Basically, a recipe becomes a record in the dedicated collection on Remote Settings.
    When it is disabled, the associated record is deleted.

    Since Normandy already has the required approval/signoff features, the integration
    bypasses the one of Remote Settings (leveraging a specific server configuration for this
    particular collection).

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

    MAIN_BUCKET_ID = "main"
    """The name of the publicly readable bucket of Remote Settings where the approved
    records are published.
    """

    def __init__(self):
        # Kinto is the underlying implementation of Remote Settings. The client
        # is basically a tiny abstraction on top of the requests library.
        self.client = (
            kinto_http.Client(
                server_url=settings.REMOTE_SETTINGS_URL,
                auth=(settings.REMOTE_SETTINGS_USERNAME, settings.REMOTE_SETTINGS_PASSWORD),
                bucket=settings.REMOTE_SETTINGS_BUCKET_ID,
                collection=settings.REMOTE_SETTINGS_COLLECTION_ID,
                retry=settings.REMOTE_SETTINGS_RETRY_REQUESTS,
            )
            if settings.REMOTE_SETTINGS_URL
            else None
        )

    def check_config(self):
        """
        Verify that integration with Remote Settings is configured properly.
        """
        if self.client is None:
            return  # no check if disabled.

        required_keys = ["COLLECTION_ID", "USERNAME", "PASSWORD"]
        for key in required_keys:
            if not getattr(settings, f"REMOTE_SETTINGS_{key}"):
                msg = f"set settings.REMOTE_SETTINGS_{key} to use Remote Settings integration"
                raise ImproperlyConfigured(msg)

        # Test authentication.
        server_info = self.client.server_info()
        is_authenticated = (
            "user" in server_info
            and settings.REMOTE_SETTINGS_USERNAME in server_info["user"]["id"]
        )
        if not is_authenticated:
            raise ImproperlyConfigured("Invalid Remote Settings credentials")

        # Test that collection is writable.
        metadata = self.client.get_collection()
        if server_info["user"]["id"] not in metadata["permissions"].get("write", []):
            raise ImproperlyConfigured(
                f"Remote Settings collection {settings.REMOTE_SETTINGS_COLLECTION_ID} "
                "is not writable."
            )

        # Test that collection has the proper review settings.
        capabilities = server_info["capabilities"]
        if "signer" in capabilities:
            signer_config = capabilities["signer"]
            normandy_resource = [
                r
                for r in signer_config["resources"]
                if r["source"]["bucket"] == settings.REMOTE_SETTINGS_BUCKET_ID
                and r["source"]["collection"] == settings.REMOTE_SETTINGS_COLLECTION_ID
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
                    "Review was not disabled on Remote Settings collection "
                    f"{settings.REMOTE_SETTINGS_COLLECTION_ID}."
                )

    def published_recipes(self):
        """
        Return the current list of remote records.
        """
        if self.client is None:
            raise ImproperlyConfigured("Remote Settings is not enabled.")

        return self.client.get_records(bucket=self.MAIN_BUCKET_ID)

    def publish(self, recipe, approve_changes=True):
        """
        Publish the specified `recipe` on the remote server by upserting a record.
        """
        if self.client is None:
            return  # no-op if disabled.

        # 1. Put the record.
        record = recipe_as_record(recipe)
        self.client.update_record(data=record)
        # 2. Approve the changes immediately (multi-signoff is disabled).
        if approve_changes:
            self.approve_changes()

        logger.info(f"Published record '{recipe.id}' for recipe {recipe.name!r}")

    def unpublish(self, recipe, approve_changes=True):
        """
        Unpublish the specified `recipe` by deleted its associated record on the remote server.
        """
        if self.client is None:
            return  # no-op if disabled.

        # 1. Delete the record.
        try:
            self.client.delete_record(id=str(recipe.id))

        except kinto_http.KintoException as e:
            if e.response.status_code == 404:
                logger.warning(f"The recipe '{recipe.id}' was never published. Skip.")
                return
            raise
        # 2. Approve the changes immediately (multi-signoff is disabled).
        if approve_changes:
            self.approve_changes()

        logger.info(f"Deleted record '{recipe.id}' of recipe {recipe.name!r}")

    def approve_changes(self):
        """
        Approve the changes made in the workspace collection.

        .. note::
            This only works because multi-signoff is disabled for the Normandy recipes
            in configuration (see :ref:`remote-settings-install`)
        """
        if self.client is None:
            return  # no-op if disabled.

        try:
            self.client.patch_collection(data=APPROVE_CHANGES_FLAG)

        except kinto_http.exceptions.KintoException:
            # Approval failed unexpectedly.
            # The changes in the `main-workspace` bucket must be reverted.
            records_in_workspace = self.client.get_records()
            records_in_prod = self.client.get_records(bucket=self.MAIN_BUCKET_ID)
            in_prod_by_id = {r["id"]: r for r in records_in_prod}
            # Compare records collection in prod vs. in workspace.
            for record in records_in_workspace:
                in_prod = in_prod_by_id.pop(record["id"], None)
                if in_prod is None:
                    # Record only exists in workspace, delete it.
                    self.client.delete_record(id=record["id"])
                elif not records_equal(record, in_prod):
                    # Record was modified in workspace, restore it.
                    self.client.update_record(data=in_prod)
            # Remaining records only exist in prod, re-create them.
            for in_prod in in_prod_by_id.values():
                self.client.create_record(data=in_prod)

            raise
