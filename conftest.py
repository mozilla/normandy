# Configuration file for running our tests
import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--env",
        action="store",
        required=False,
        default="dev",
        help="Choose a test environment: dev, stage, or prod",
    )


@pytest.fixture
def env(request):
    return request.config.getoption("--env")
