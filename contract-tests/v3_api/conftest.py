import os
import pytest
import subprocess
import uuid

from faker import Faker


@pytest.fixture(scope="session")
def headers():
    # Create a test user
    fake = Faker()
    email = fake.company_email()
    user = fake.user_name()

    # Add them as a superuser to the system running in Docker
    docker_compose = (
        subprocess.check_output("which docker-compose", shell=True).decode("ascii").strip("\n")
    )
    subprocess.call(
        "{} run app python manage.py createsuperuser --noinput --email={} --user={}".format(
            docker_compose, email, user
        ),
        shell=True,
    )

    # Return the authorization header that we need
    return {"Authorization": "Insecure {}".format(email)}
