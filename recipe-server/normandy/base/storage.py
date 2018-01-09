import re

from django.utils.encoding import force_text
from django.utils.functional import keep_lazy_text

from inmemorystorage import InMemoryStorage
from storages.backends.s3boto3 import S3Boto3Storage

class PermissiveFilenameStorageMixin(object):
    """
    A storage class mixin that is is more permissive about valid filenames.

    In the original implemtnation, "anything that is not a unicode
    alphanumeric, dash, underscore, or dot is removed". This version
    allows any non-whitespace character in filenames. Leading and
    trailing whitespaces are removed and internal whitespace is
    converted to underscores.
    """

    @keep_lazy_text
    def get_valid_name(self, name):
        """
        Returns a filename, based on the provided filename, that's
        suitable for use in the target storage system.
        """
        name = force_text(name).strip()
        return re.sub('\s+', '_', name)


class InMemoryPermissiveStorage(PermissiveFilenameStorageMixin, InMemoryStorage):
    pass


class S3Boto3PermissiveStorage(PermissiveFilenameStorageMixin, S3Boto3Storage):
    pass
