import pytest
import subprocess


@pytest.fixture(scope="session")
def headers():
    # Add a superuser to the system running in Docker
    docker_compose = (
        subprocess.check_output("which docker-compose", shell=True).decode("ascii").strip("\n")
    )
    email = "test-user@example.com"
    user = "testuser"
    subprocess.call(
        "{} run app python manage.py createsuperuser --noinput --email={} --user={}".format(
            docker_compose, email, user
        ),
        shell=True,
    )

    # Return the authorization header that we need
    return {"Authorization": "Insecure {}".format(email)}
