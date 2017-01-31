FROM python:3.5.2-slim
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl apt-transport-https

# Install node from NodeSource
RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb https://deb.nodesource.com/node_4.x jessie main' > /etc/apt/sources.list.d/nodesource.list && \
    echo 'deb-src https://deb.nodesource.com/node_4.x jessie main' >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs
RUN npm install -g npm@3.x.x

COPY ./requirements /app/requirements
COPY ./package.json /app/package.json
RUN pip install -U 'pip>=8' && \
    pip install --upgrade --no-cache-dir -r requirements/default.txt -c requirements/constraints.txt && \
    npm install

COPY . /app
ENV PATH="/app/node_modules/.bin:$PATH"
USER app

CMD ["/app/bin/default_command"]
