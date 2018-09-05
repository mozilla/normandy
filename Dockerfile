FROM python:3.6-slim@sha256:fc3571bbd925d87d25dee440540a2d4dc57464a8db0a1431c6716901bc3648ee
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    gcc libpq-dev curl apt-transport-https libffi-dev openssh-client gnupg

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
RUN pip install --upgrade --no-cache-dir -r requirements/pip.txt && \
    pip install --upgrade --no-cache-dir -r requirements/default.txt && \
    yarn install --frozen-lockfile

COPY . /app
RUN NODE_ENV=production yarn build && \
    DJANGO_CONFIGURATION=Build ./manage.py collectstatic --no-input && \
    mkdir -p media && chown app:app media

USER app
ENV DJANGO_SETTINGS_MODULE=normandy.settings \
    DJANGO_CONFIGURATION=Production \
    PORT=8000 \
    CMD_PREFIX="" \
    NEW_RELIC_CONFIG_FILE=newrelic.ini
EXPOSE $PORT

ENTRYPOINT ["/bin/bash", "/app/bin/run.sh"]

CMD ["start"]
