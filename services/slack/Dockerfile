FROM node:20-slim

WORKDIR /services/slack

RUN apt-get update && \
  apt-get install -y \
  make

COPY package.json         ./
COPY tmp/lib/yarn.lock    /
COPY tmp/lib/package.json /

RUN yarn --cwd "/" install

COPY Makefile              ./
COPY tsconfig.json         ./
COPY tmp/lib/zunou-graphql /lib/zunou-graphql
COPY tmp/lib/zunou-queries /lib/zunou-queries
COPY src                   ./src

RUN make build

CMD [ "make", "serve" ]
