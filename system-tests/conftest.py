import pytest
from marionette import Marionette


@pytest.yield_fixture
def marionette():
    client = Marionette(host='localhost', port=2828)
    client.start_session()
    yield client
    client.delete_session()
