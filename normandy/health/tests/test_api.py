from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest

from normandy.health.api import views


def test_version(client, mocker):
    get_version_info = mocker.patch('normandy.health.api.views.get_version_info')
    get_version_info.return_value = ('<git hash>', '<tag>')

    res = client.get('/__version__')
    assert res.status_code == 200
    assert res.data == {
        'source': 'https://github.com/mozilla/normandy',
        'commit': '<git hash>',
        'commit_link': 'https://github.com/mozilla/normandy/commit/<git hash>',
        'configuration': 'Test',
        'version': '<tag>',
    }


@pytest.mark.django_db
def test_lbheartbeat_makes_no_db_queries(client):
    queries = CaptureQueriesContext(connection)
    with queries:
        res = client.get('/__lbheartbeat__')
        assert res.status_code == 200
    assert len(queries) == 0


class TestGetVersionInfo(object):

    @pytest.fixture
    def version_info_dir(self, tmpdir, settings):
        views._tag = None
        views._commit = None
        settings.BASE_DIR = tmpdir.strpath
        return tmpdir.mkdir('__version__')

    @pytest.fixture
    def commit_file(self, version_info_dir):
        f = version_info_dir.join('commit')
        f.write('bc685e4be05a182ae819990509c92affa3d882ab\n')
        return f

    @pytest.fixture
    def tag_file(self, version_info_dir):
        f = version_info_dir.join('tag')
        f.write('v20\n')
        return f

    def test_with_both(self, commit_file, tag_file):
        commit, tag = views.get_version_info()
        assert commit == 'bc685e4be05a182ae819990509c92affa3d882ab'
        assert tag == 'v20'

    def test_with_only_commit(self, commit_file):
        commit, tag = views.get_version_info()
        assert commit == 'bc685e4be05a182ae819990509c92affa3d882ab'
        assert tag == 'unknown'

    def test_with_only_tag(self, tag_file):
        commit, tag = views.get_version_info()
        assert commit == 'unknown'
        assert tag == 'v20'

    def test_with_nothing(self, version_info_dir):
        commit, tag = views.get_version_info()
        assert commit == 'unknown'
        assert tag == 'unknown'

    def test_it_is_cached(self, commit_file, tag_file):
        commit, tag = views.get_version_info()
        assert commit == 'bc685e4be05a182ae819990509c92affa3d882ab'
        assert tag == 'v20'
        commit_file.remove()
        tag_file.remove()
        assert (commit, tag) == views.get_version_info()
