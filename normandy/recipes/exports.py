import logging

import kinto_http
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.functional import cached_property


logger = logging.getLogger(__name__)

REMOTE_SETTINGS_BUCKET = "main-workspace"


class RemoteSettings(object):
    """
    Interacts with a RemoteSettings service.

    """
    def __init__(self):
        self.check_config()
        self.cid = settings.REMOTE_SETTINGS_COLLECTION_ID

    @cached_property
    def client(self):
        client = kinto_http.Client(server_url=settings.REMOTE_SETTINGS_URL,
                                   auth=(str(settings.REMOTE_SETTINGS_USERNAME), str(settings.REMOTE_SETTINGS_PASSWORD)),
                                   retry=3,
                                   bucket=REMOTE_SETTINGS_BUCKET,
                                   collection=self.cid)
        return client

    def check_config(self):
        required_keys = ["URL", "COLLECTION_ID", "USERNAME", "PASSWORD"]
        for key in required_keys:
            if getattr(settings, "REMOTE_SETTINGS_" + key) is None:
                msg = "set settings.REMOTE_SETTINGS_{} to use Remote Settings integration".format(key)
                raise ImproperlyConfigured(msg)

    def publish(self, revision):
        from normandy.recipes.api.v3.serializers import RecipeRevisionSerializer

        serializer = RecipeRevisionSerializer(revision)
        as_dict = serializer.data.copy()
        as_dict["id"] = str(revision.recipe.id)
        del as_dict["recipe"]
        del as_dict["approval_request"]

        self.client.update_record(data=as_dict)
        self.client.patch_collection(id=self.cid, data={ "status": "to-sign" })

    def unpublish(self, revision):
        self.client.delete_record(id=str(revision.recipe.id))
        self.client.patch_collection(id=self.cid, data={ "status": "to-sign" })
