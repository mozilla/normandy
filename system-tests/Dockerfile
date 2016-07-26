FROM python:2.7.12-slim
WORKDIR /test

COPY ./requirements.txt /test/requirements.txt
RUN pip install -U 'pip>=8' setuptools && \
    pip install --upgrade --no-cache-dir -r requirements.txt

COPY . /test
RUN mkdir -p /test_artifacts && \
    chmod 777 /test_artifacts
