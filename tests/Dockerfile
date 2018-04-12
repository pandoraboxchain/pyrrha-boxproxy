FROM node:9

LABEL maintainer="kostysh@gmail.com"

ARG WITH_COVERAGE=0
ENV WITH_COVERAGE=$WITH_COVERAGE

RUN mkdir /pyrrha-boxproxy
COPY ./package.json /pyrrha-boxproxy/package.json

# Installing of dependencies
WORKDIR /pyrrha-boxproxy
RUN npm i --silent && npm i \
        pyrrha-js@https://github.com/pandoraboxchain/pyrrha-js.git#v1.4.4 \
        @babel/cli@7.0.0-beta.44 \
        @babel/core@7.0.0-beta.44 \
        @babel/plugin-proposal-object-rest-spread@7.0.0-beta.44 \
        @babel/plugin-syntax-object-rest-spread@7.0.0-beta.44 \
        @babel/polyfill@7.0.0-beta.44 \
        @babel/preset-env@7.0.0-beta.44 \
        @babel/register@7.0.0-beta.44 \
        ganache-sandbox@https://github.com/pandoraboxchain/ganache-sandbox.git#v0.1.1 \
        zeppelin-solidity \
        mocha \
        mocha-lcov-reporter \
        chai \
        istanbul@1.1.0-alpha.1 \
        codacy-coverage --silent

# Fetching of contracts sources
WORKDIR /
COPY ./pyrrha-consensus/contracts /pyrrha-boxproxy/contracts 
COPY ./pyrrha-consensus/migrations /pyrrha-boxproxy/migrations
COPY ./src /pyrrha-boxproxy/src
COPY ./config /pyrrha-boxproxy/config
COPY ./tests /pyrrha-boxproxy/tests
COPY ./tests/truffle.js /pyrrha-boxproxy/truffle.js
COPY ./tests/truffle-config.js /pyrrha-boxproxy/truffle-config.js
COPY ./tests/.babelrc /pyrrha-boxproxy/.babelrc
COPY ./.git /pyrrha-boxproxy/.git
COPY ./tests/tests-runner.sh /pyrrha-boxproxy/tests-runner.sh

ENV DEBUG=boxproxy,boxproxy:events
WORKDIR /pyrrha-boxproxy
CMD [ "/pyrrha-boxproxy/tests-runner.sh" ]
