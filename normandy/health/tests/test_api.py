import pytest
from rest_framework.reverse import reverse


def test_version(client, mocker):
    get_commit = mocker.patch('normandy.health.api.views.get_commit')
    get_commit.return_value = '<git hash>'

    res = client.get('/__version__')
    assert res.status_code == 200
    assert res.data == {
        'source': 'https://github.com/mozilla/normandy',
        'commit': '<git hash>',
    }
