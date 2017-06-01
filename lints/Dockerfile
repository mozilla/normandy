FROM python:3.6.0-slim
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl apt-transport-https git

# Install node from NodeSource
RUN curl -sL https://deb.nodesource.com/setup_6.x | bash - && \
	apt-get update && apt-get install -y nodejs && \
	npm install npm@latest -g

COPY ./requirements /app/requirements
COPY ./package.json /app/package.json
RUN pip install -U 'pip>=8' && \
    pip install --upgrade --no-cache-dir -r requirements/default.txt -c requirements/constraints.txt && \
    npm install

COPY . /app
ENV PATH="/app/node_modules/.bin:$PATH"
USER app

CMD ["/app/bin/default_command"]
