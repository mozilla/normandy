# Configuration file for running contract-tests
import pytest
import requests
import urllib3

# Disable warnings about unverified HTTPS requests
urllib3.disable_warnings()


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
    r.raise_for_status()
    data = r.json()

    if not data.get("configuration") == "ProductionReadOnly":
        pytest.skip("Server config is not ProductionReadOnly")
