import logging

import kinto_http
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger(__name__)

REMOTE_SETTINGS_BUCKET = "main-workspace"
NB_RETRY_REQUESTS = 3


def recipe_as_record(recipe):
    """
    Transform a recipe to a dict with the minimum amount of fields needed for clients
    to verify and execute recipes.

    :param recipe: a recipe ready to be exported.
    :returns: a dict to be posted on Remote Settings.
    """
    from normandy.recipes.api.v1.serializers import MinimalRecipeSerializer

    serializer = MinimalRecipeSerializer(recipe)
    record = serializer.data.copy()
    record["id"] = str(recipe.id)
    return record


class RemoteSettings(object):
    """
    Interacts with a RemoteSettings service.

    Basically, a recipe becomes a record in the dedicated collection on Remote Settings.
    When it is disabled, the associated record is deleted.

    Since Normandy already has the required approval/signoff features, the integration
    bypasses the one of Remote Settings (leveraging a specific server configuration for this
    particular collection).

    """

    def __init__(self):
        self.check_config()
        self.cid = str(settings.REMOTE_SETTINGS_COLLECTION_ID)

    @property
    def client(self):
        # Kinto is the underlying implementation of Remote Settings. The client
        # is basically a tiny abstraction on top of the requests library.
        client = kinto_http.Client(
            server_url=str(settings.REMOTE_SETTINGS_URL),
            auth=(str(settings.REMOTE_SETTINGS_USERNAME), str(settings.REMOTE_SETTINGS_PASSWORD)),
            bucket=REMOTE_SETTINGS_BUCKET,
            collection=self.cid,
            retry=NB_RETRY_REQUESTS,
        )
        return client

    def check_config(self):
        # RemoteSettings config is not mandatory if not enabled.
        if not settings.REMOTE_SETTINGS_ENABLED:
            return

        required_keys = ["URL", "COLLECTION_ID", "USERNAME", "PASSWORD"]
        for key in required_keys:
            if getattr(settings, "REMOTE_SETTINGS_" + key) is None:
                msg = "set settings.REMOTE_SETTINGS_{} to use Remote Settings integration".format(
                    key
                )
                raise ImproperlyConfigured(msg)

    def publish(self, recipe):
        """
        Publish the specified `recipe` on the remote server by upserting a record.
        """
        record = recipe_as_record(recipe)
        self.client.update_record(data=record)
        self.client.patch_collection(id=self.cid, data={"status": "to-sign"})
        logger.info(f"Published record '{recipe.id}' for recipe {recipe}")

    def unpublish(self, recipe):
        """
        Unpublish the specified `recipe` by deleted its associated records on the remote server.
        """
        try:
            self.client.delete_record(id=str(recipe.id))

        except kinto_http.KintoException as e:
            if e.response.status_code == 404:
                logger.warning(f"The recipe '{recipe.id}' was never published. Skip.")
                return
            raise

        self.client.patch_collection(id=self.cid, data={"status": "to-sign"})
        logger.info(f"Deleted record '{recipe.id}' of recipe {recipe}")
