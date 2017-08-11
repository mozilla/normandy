import pytest
import configparser
import pyotp
import time


@pytest.fixture
def conf():
    """Read config.ini file."""
    config = configparser.ConfigParser()
    config.read('config.ini')
    return config


@pytest.fixture(scope="session")
def base_url():
    """Return base url fixture."""
    return 'https://normandy.dev.mozaws.net/control-new/'


@pytest.fixture
def qr_code(conf, worker_id):
    """Return qr code."""
    secret = conf.get('login', 'secret')
    if worker_id == 'master':
        index = 0
    else:
        index = int(worker_id[2:])
    time.sleep(index*30)
    totp = pyotp.TOTP(secret)
    return totp.now()
