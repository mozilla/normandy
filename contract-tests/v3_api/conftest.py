import pytest


@pytest.fixture(scope="session")
def headers():
    # Return the authorization header that we need
    return {"Authorization": "Insecure test-user@example.com"}
