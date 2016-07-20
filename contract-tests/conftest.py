# Configuration file for running contract-tests
import pytest
import requests


def pytest_addoption(parser):
    parser.addoption(
        "--server",
        dest="server",
        default="http://localhost:8000",
        help="Server to run tests against"
    )
    parser.addoption(
        "--no-verify",
        action="store_false",
        dest="verify",
        default=None,
        help="Server to run tests against"
    )


@pytest.fixture
def conf(request):
    return request.config


class RequestVerifyWrapper(object):
    """
    `request.Session` doesn't have a way to permanently change the verify flag. This provides that.
    """
    def __init__(self, verify):
        self.verify = verify
        self.session = requests.Session()

    def get(self, *args, **kwargs):
        return self.session.get(*args, verify=self.verify, **kwargs)

    # TODO: Add other HTTP methods as needed


@pytest.fixture
def requests_session(conf):
    verify = conf.getoption('verify')
    return RequestVerifyWrapper(verify)
