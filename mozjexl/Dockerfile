FROM node:4.8.3-slim
WORKDIR /app
ENV PATH="/app/node_modules/.bin:$PATH"
COPY ./package.json /app/package.json
RUN npm install
COPY . /app
