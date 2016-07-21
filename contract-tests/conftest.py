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
        help="Don't verify SSL certs"
    )


@pytest.fixture
def conf(request):
    return request.config


@pytest.fixture
def requests_session(conf):
    session = requests.Session()
    session.verify = conf.getoption('verify')
    return session
