FROM python:3.5.2-slim
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl apt-transport-https libffi-dev git ca-certificates

# Install node from NodeSource
RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb https://deb.nodesource.com/node_4.x jessie main' > /etc/apt/sources.list.d/nodesource.list && \
    echo 'deb-src https://deb.nodesource.com/node_4.x jessie main' >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs

COPY requirements /app/requirements
COPY package.json yarn.lock /app/
RUN pip install -U 'pip>=8' && \
    pip install --upgrade --no-cache-dir -r requirements/default.txt -c requirements/constraints.txt && \
    npm install -g yarn@^0.16 && \
    yarn install --pure-lockfile || cat /app/yarn-error.log

COPY . /app
RUN NODE_ENV=production ./node_modules/.bin/webpack && \
    DJANGO_CONFIGURATION=Build ./manage.py collectstatic --no-input && \
    mkdir -p media && chown app:app media && \
    mkdir -p __version__ && \
    mkdir -p /test_artifacts && \
    chmod 777 /test_artifacts && \
    git rev-parse HEAD > __version__/commit && \
    git describe --tags --exact-match > __version__/tag || true # may fail if not on a tag

USER app
ENV DJANGO_SETTINGS_MODULE=normandy.settings \
    DJANGO_CONFIGURATION=Production \
    PORT=8000
EXPOSE $PORT
CMD gunicorn normandy.wsgi:application \
    --log-file - \
    --worker-class ${GUNICORN_WORKER_CLASS:-sync} \
    --max-requests ${GUNICORN_MAX_REQUESTS:-0}
