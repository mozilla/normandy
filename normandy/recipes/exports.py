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
    )  # avoid circular imports

    serializer = MinimalRecipeSerializer(recipe)
    record = serializer.data
    record["id"] = str(recipe.id)
    return record


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

    def publish(self, recipe):
        """
        Publish the specified `recipe` on the remote server by upserting a record.
        """
        if self.client is None:
            return  # no-op if disabled.

        # 1. Put the record.
        record = recipe_as_record(recipe)
        self.client.update_record(data=record)
        try:
            # 2. Approve the changes immediately (multi-signoff is disabled).
            self.client.patch_collection(data=APPROVE_CHANGES_FLAG)

        except kinto_http.exceptions.KintoException:
            # Approval failed. The changes in the `main-workspace` bucket must be reverted.
            try:
                # If it was an update of existing record, revert the modifications in the
                # `main-workspace` bucket by restoring the version that was published
                # in the `main` bucket.
                in_prod = self.client.get_record(id=record["id"], bucket=self.MAIN_BUCKET_ID)
                self.client.update_record(data=in_prod)

            except kinto_http.exceptions.KintoException as e:
                if e.response.status_code == 404:
                    # It was a new record that was never published in the `main` bucket,
                    # revert its creation in the `main-workspace` bucket by deleting it.
                    self.client.delete_record(id=record["id"])
            raise

        logger.info(f"Published record '{recipe.id}' for recipe {recipe.name!r}")

    def unpublish(self, recipe):
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
        try:
            # 2. Approve the changes immediately (multi-signoff is disabled).
            self.client.patch_collection(data=APPROVE_CHANGES_FLAG)

        except kinto_http.exceptions.KintoException:
            # Approval failed. The deletion from the `main-workspace` bucket must be reverted.
            # Revert its deletion from the `main-workspace` bucket by restoring the version
            # that was published in the `main` bucket.
            in_prod = self.client.get_record(id=str(recipe.id), bucket=self.MAIN_BUCKET_ID)
            self.client.update_record(data=in_prod["data"])
            raise

        logger.info(f"Deleted record '{recipe.id}' of recipe {recipe.name!r}")
