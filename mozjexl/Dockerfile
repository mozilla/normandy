FROM node:4.8.3-slim
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
USER APP
ENV PATH="/app/node_modules/.bin:$PATH"
COPY ./package.json /app/package.json
RUN npm install -g npm@5 &&
    npm install
COPY . /app
RUN npm test
