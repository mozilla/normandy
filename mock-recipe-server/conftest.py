import pytest

from utils import APIPath


def pytest_addoption(parser):
    parser.addoption('--mock-server-dir', help='mock-server build directory')


@pytest.fixture
def root_path(request):
    build_dir = request.config.getoption('--mock-server-dir')
    if not build_dir:
        pytest.fail('--mock-server-dir was not provided, but is required for this test')
    return APIPath(build_dir, 'http://example.com/')
