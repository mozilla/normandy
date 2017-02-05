FROM python:3.5.2-slim
WORKDIR /functional-tests
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl apt-transport-https

COPY ./requirements /functional-tests/requirements
RUN pip install -U 'pip>=8' && \
    pip install --upgrade --no-cache-dir -r requirements/default.txt -c requirements/constraints.txt

COPY . /functional-tests

CMD ["py.test", "/functional-tests"]
