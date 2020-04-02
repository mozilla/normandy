import pytest
import subprocess


@pytest.fixture(scope="session")
def headers():
    email = "test-user@example.com"
    user = "testuser"

    # Return the authorization header that we need
    return {"Authorization": "Insecure {}".format(email)}
