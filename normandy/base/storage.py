import re

from django.core.files.storage import Storage
from django.utils.encoding import force_text
from django.utils.functional import keep_lazy_text

from inmemorystorage import InMemoryStorage
from storages.backends.s3boto3 import S3Boto3Storage
from storages.backends.gcloud import GoogleCloudStorage


class RestrictedOverwriteStorageMixin(object):
    def get_available_name(self, name, max_length=None):
        if self.exists(name):
            raise FileExistsError()
        return super().get_available_name(name, max_length)


class PermissiveFilenameStorageMixin(object):
    """
    A storage class mixin that is is more permissive about valid filenames.

    In the original implementation, "anything that is not a unicode
    alphanumeric, dash, underscore, or dot is removed". This modified version
    allows most characters, except a few special characters. Leading and
    trailing whitespaces are removed and internal whitespace is converted to
    underscores.

    File names produced follow recommended guidelines for both AWS S3 and GCP
    Cloud Storage object names.
    """

    @keep_lazy_text
    def get_valid_name(self, name):
        """
        Returns a filename, based on the provided filename, that's
        suitable for use in the target storage system.
        """

        name = force_text(name).strip()
        # remove "characters to avoid", as described by S3's and GCP's docs
        # https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingMetadata.html#object-key-guidelines-avoid-characters
        # https://cloud.google.com/storage/docs/naming#objectnames
        name = re.sub(r'[\\{}^%`\[\]<>~#|\x00-\x1F\x7F-\xFF\'"*?]', "", name)
        return re.sub(r"\s+", "_", name)


class NormandyS3Boto3Storage(
    PermissiveFilenameStorageMixin, RestrictedOverwriteStorageMixin, S3Boto3Storage
):
    """
    An S3 storage that allows a broader range of filenames.
    """


class NormandyGoogleCloudStorage(
    PermissiveFilenameStorageMixin, RestrictedOverwriteStorageMixin, GoogleCloudStorage
):
    """
    A GCP Cloud Storage backend customized for Normandy's use case.
    """


class NormandyInMemoryStorage(
    PermissiveFilenameStorageMixin, RestrictedOverwriteStorageMixin, InMemoryStorage
):
    """
    An in-memory storage that allows a broader range of filenames.

    For tests that use storage.
    """


class NotAllowedStorage(Storage):
    """
    Does not allow any usage of storage. Throws an error if it is used.

    For tests that don't use storage.
    """

    class NotAllowedException(Exception):
        pass

    def path(self, name):
        raise self.NotAllowedException()

    def delete(self, name):
        raise self.NotAllowedException()

    def exists(self, name):
        raise self.NotAllowedException()

    def listdir(self, path):
        raise self.NotAllowedException()

    def size(self, name):
        raise self.NotAllowedException()

    def url(self, name):
        raise self.NotAllowedException()

    def get_accessed_time(self, name):
        raise self.NotAllowedException()

    def get_created_time(self, name):
        raise self.NotAllowedException()

    def get_modified_time(self, name):
        raise self.NotAllowedException()
