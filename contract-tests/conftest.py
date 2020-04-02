# Configuration file for running contract-tests
import os
import pytest
import requests
import sys
import urllib3

# Disable any warnings about SSL connections
urllib3.disable_warnings()

# Fix our path so our tests can see modules inside Normandy
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def pytest_addoption(parser):
    parser.addoption(
        "--server",
        dest="server",
        default="http://localhost:8000",
        help="Server to run tests against",
    )
    parser.addoption(
        "--no-verify",
        action="store_false",
        dest="verify",
        default=None,
        help="Don't verify SSL certs",
    )


@pytest.fixture
def conf(request):
    return request.config


@pytest.fixture
def requests_session(conf):
    session = requests.Session()
    session.verify = conf.getoption("verify")
    return session


@pytest.fixture
def only_readonly(requests_session, conf):
    """Check if the current server is a readonly server, skip if it is not"""
    r = requests_session.get(conf.getoption("server") + "/__version__")

    if r.status_code == 404:
        pytest.skip("__version__ endpoint does not exist")

    r.raise_for_status()
    data = r.json()

    if not data.get("configuration") == "ProductionReadOnly":
        pytest.skip("Server config is not ProductionReadOnly")
