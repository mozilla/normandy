from datetime import datetime

from django.db import connection
from django.test.utils import CaptureQueriesContext

import pytest

from normandy.health.api import views
from normandy.base.tests import Whatever


def test_version(client, mocker):
    get_version_info = mocker.patch('normandy.health.api.views.get_version_info')
    get_version_info.return_value = {
        'commit': '<git hash>',
        'version': '<tag>',
        'build_time': datetime.now(),
    }

    res = client.get('/__version__')
    assert res.status_code == 200
    assert res.data == {
        'source': 'https://github.com/mozilla/normandy',
        'commit': '<git hash>',
        'commit_link': 'https://github.com/mozilla/normandy/commit/<git hash>',
        'configuration': 'Test',
        'version': '<tag>',
        'build_time': Whatever(),
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
        f.commit = 'bc685e4be05a182ae819990509c92affa3d882ab'
        f.write(f.commit + '\n')
        return f

    @pytest.fixture
    def tag_file(self, version_info_dir):
        f = version_info_dir.join('tag')
        f.tag = 'v20'
        f.write(f.tag + '\n')
        return f

    @pytest.fixture
    def build_time_file(self, version_info_dir):
        f = version_info_dir.join('build_time')
        ts = 1493051820
        f.write('1493051820\n')
        f.datetime = datetime.utcfromtimestamp(ts)
        return f

    @pytest.fixture
    def clear_version_info(self):
        """Clear the cache for get_version_info() after each test run"""
        try:
            yield
        finally:
            views.get_version_info.cache_clear()

    def test_with_everything(self, commit_file, tag_file, build_time_file, clear_version_info):
        version_info = views.get_version_info()
        assert version_info['commit'] == commit_file.commit
        assert version_info['version'] == tag_file.tag
        assert version_info['build_time'] == build_time_file.datetime

    def test_with_only_commit(self, commit_file, clear_version_info):
        version_info = views.get_version_info()
        assert version_info['commit'] == commit_file.commit
        assert version_info['version'] is None
        assert version_info['build_time'] is None

    def test_with_only_tag(self, tag_file, clear_version_info):
        version_info = views.get_version_info()
        assert version_info['commit'] is None
        assert version_info['version'] == tag_file.tag
        assert version_info['build_time'] is None

    def test_with_only_build_time(self, build_time_file, clear_version_info):
        version_info = views.get_version_info()
        assert version_info['commit'] is None
        assert version_info['version'] is None
        assert version_info['build_time'] == build_time_file.datetime

    def test_with_nothing(self, version_info_dir, clear_version_info):
        version_info = views.get_version_info()
        assert version_info['commit'] is None
        assert version_info['version'] is None
        assert version_info['build_time'] is None

    def test_it_is_cached(self, commit_file, tag_file, build_time_file, clear_version_info):
        version_info = views.get_version_info()
        commit_file.remove()
        tag_file.remove()
        build_time_file.remove()
        assert version_info == views.get_version_info()
