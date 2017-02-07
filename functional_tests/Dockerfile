FROM python:3.6.0-slim
WORKDIR /functional_tests
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl apt-transport-https

COPY ./requirements /functional_tests/requirements
RUN pip install -U 'pip>=8' && \
    pip install --upgrade --no-cache-dir -r requirements/default.txt -c requirements/constraints.txt

COPY . /functional_tests
