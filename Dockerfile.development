FROM python:3.7-slim@sha256:3e4be41076ebb6fe8c3112b220ce133ef0dc49c814024e4874ca76eae3c8dec0
WORKDIR /app
RUN groupadd --gid 10001 app && useradd -g app --uid 10001 --shell /usr/sbin/nologin app
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    gcc libpq-dev curl apt-transport-https libffi-dev openssh-client gnupg python-dev libgmp3-dev

# Install node from NodeSource
RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb https://deb.nodesource.com/node_8.x jessie main' > /etc/apt/sources.list.d/nodesource.list && \
    echo 'deb-src https://deb.nodesource.com/node_8.x jessie main' >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo 'deb https://dl.yarnpkg.com/debian/ stable main' > /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install yarn

COPY ./requirements /app/requirements
COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock
RUN pip install --upgrade --no-cache-dir -r requirements/default.txt -r requirements/dev.txt && \
    yarn install --frozen-lockfile

COPY . /app
RUN NODE_ENV=production yarn build && \
    DJANGO_CONFIGURATION=Build ./manage.py collectstatic --no-input && \
    mkdir -p media && chown app:app media

USER app
ENV DJANGO_SETTINGS_MODULE=normandy.settings \
    DJANGO_CONFIGURATION=Development \
    PORT=8000 \
    CMD_PREFIX="" \
    NEW_RELIC_CONFIG_FILE=newrelic.ini
EXPOSE $PORT

CMD $CMD_PREFIX gunicorn \
    --log-file - \
    --worker-class ${GUNICORN_WORKER_CLASS:-sync} \
    --max-requests ${GUNICORN_MAX_REQUESTS:-0} \
    normandy.wsgi:application
