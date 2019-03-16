from itertools import chain

import pytest

from django.core.files.base import ContentFile

from normandy.base.storage import PermissiveFilenameStorageMixin


class TestPermissiveFilenameStorageMixin(object):
    @pytest.fixture
    def storage(self):
        return PermissiveFilenameStorageMixin()

    class TestGetValidName(object):
        def test_it_works(self, storage):
            assert storage.get_valid_name("simple-name") == "simple-name"

        def test_it_removes_whitespace(self, storage):
            assert storage.get_valid_name(" hello  world  ") == "hello_world"

        def test_it_removes_some_special_chars(self, storage):
            assert (
                storage.get_valid_name("""special \\^`<>{}[]#%"'~|[]*? characters""")
                == "special_characters"
            )

        def test_it_removes_non_printable_ascii_characters(self, storage):
            for c in chain(range(32), range(127, 256)):
                assert storage.get_valid_name(chr(c)) == ""

        def test_it_allows_an_addon_filename(self, storage):
            addon_filename = "shield-recipe-client@mozilla.org-82.1.g32b36827-signed.xpi"
            assert storage.get_valid_name(addon_filename) == addon_filename


class TestRestrictedOverwriteFilenameStorageMixin(object):
    def test_get_available_name(self, storage):
        assert storage.get_available_name("tmp/f00") == "tmp/f00"

    def test_file_exists(self, storage):
        storage.save("tmp/foo", ContentFile(b""))
        with pytest.raises(FileExistsError):
            storage.get_available_name("tmp/foo")
