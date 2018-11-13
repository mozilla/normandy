import logging

import kinto_http
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger(__name__)

REMOTE_SETTINGS_BUCKET = "main-workspace"


class RemoteSettings(object):
    """
    Interacts with a RemoteSettings service.

    """

    def __init__(self):
        self.check_config()
        self.cid = str(settings.REMOTE_SETTINGS_COLLECTION_ID)

    @property
    def client(self):
        client = kinto_http.Client(
            server_url=str(settings.REMOTE_SETTINGS_URL),
            auth=(str(settings.REMOTE_SETTINGS_USERNAME), str(settings.REMOTE_SETTINGS_PASSWORD)),
            bucket=REMOTE_SETTINGS_BUCKET,
            collection=self.cid,
            retry=3,
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
        from normandy.recipes.api.v1.serializers import RecipeSerializer

        serializer = RecipeSerializer(recipe)
        as_dict = serializer.data.copy()
        as_dict["id"] = str(recipe.id)

        self.client.update_record(data=as_dict)
        self.client.patch_collection(id=self.cid, data={"status": "to-sign"})
        logger.info("Published record")

    def unpublish(self, recipe):
        self.client.delete_record(id=str(recipe.id))
        self.client.patch_collection(id=self.cid, data={"status": "to-sign"})
        logger.info("Deleted record")
