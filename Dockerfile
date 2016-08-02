FROM python:3.5.1-slim
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl apt-transport-https libffi-dev git

# Install node from NodeSource
RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb https://deb.nodesource.com/node_4.x jessie main' > /etc/apt/sources.list.d/nodesource.list && \
    echo 'deb-src https://deb.nodesource.com/node_4.x jessie main' >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs

COPY ./requirements.txt /app/requirements.txt
COPY ./package.json /app/package.json
RUN pip install -U 'pip>=8' && \
    pip install --upgrade --no-cache-dir -r requirements.txt && \
    npm install

COPY . /app
RUN ./node_modules/.bin/webpack && \
    DJANGO_CONFIGURATION=Build ./manage.py collectstatic --no-input && \
    mkdir -p media && chown app:app media && \
    mkdir -p __version__ && \
    mkdir -p /test_artifacts && \
    chmod 777 /test_artifacts && \
    git rev-parse HEAD > __version__/commit

USER app
ENV DJANGO_SETTINGS_MODULE=normandy.settings \
    DJANGO_CONFIGURATION=Production \
    PORT=8000
EXPOSE $PORT
CMD gunicorn normandy.wsgi:application \
    --log-file - \
    --worker-class ${GUNICORN_WORKER_CLASS:-sync} \
    --max-requests ${GUNICORN_MAX_REQUESTS:-0}
