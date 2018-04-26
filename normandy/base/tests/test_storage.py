from itertools import chain

import pytest

from normandy.base.storage import PermissiveFilenameStorageMixin


class TestPermissiveFilenameStorageMixing(object):

    @pytest.fixture
    def storage(self):
        return PermissiveFilenameStorageMixin()

    class TestGetValidName(object):

        def test_it_works(self, storage):
            assert storage.get_valid_name('simple-name') == 'simple-name'

        def test_it_removes_whitespace(self, storage):
            assert storage.get_valid_name(' hello  world  ') == 'hello_world'

        def test_it_removes_some_special_chars(self, storage):
            assert (storage.get_valid_name('''special \\^`<>{}[]#%"'~| characters''')
                    == 'special_characters')

        def test_it_removes_non_printable_ascii_characters(self, storage):
            for c in chain(range(32), range(127, 256)):
                assert storage.get_valid_name(chr(c)) == ''

        def test_it_allows_an_addon_filename(self, storage):
            addon_filename = 'shield-recipe-client@mozilla.org-82.1.g32b36827-signed.xpi'
            assert storage.get_valid_name(addon_filename) == addon_filename
