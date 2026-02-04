FROM node:20-slim

WORKDIR /services/uploader

RUN apt-get update && \
  apt-get install -y \
  make \
  curl # For doing internal health checks.

COPY package.json         ./
COPY tmp/lib/yarn.lock    /
COPY tmp/lib/package.json /

RUN yarn --cwd "/" install

COPY Makefile      ./
COPY tsconfig.json ./
COPY src           ./src

RUN make build

CMD [ "make", "serve" ]
