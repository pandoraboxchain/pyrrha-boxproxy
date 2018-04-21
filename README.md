[![Codacy Badge](https://api.codacy.com/project/badge/Grade/0679e7f0518248b49821f1f60f1f3be6)](https://www.codacy.com/app/kostysh/pyrrha-boxproxy?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=pandoraboxchain/pyrrha-boxproxy&amp;utm_campaign=Badge_Grade) [![Codacy Badge](https://api.codacy.com/project/badge/Coverage/ecb18a8ad15a42498b68baf016654812)](https://www.codacy.com/app/kostysh/pyrrha-boxproxy?utm_source=github.com&utm_medium=referral&utm_content=pandoraboxchain/pyrrha-boxproxy&utm_campaign=Badge_Coverage) [![Build Status](https://travis-ci.org/pandoraboxchain/pyrrha-boxproxy.svg?branch=master)](https://travis-ci.org/pandoraboxchain/pyrrha-boxproxy)  

# pyrrha-boxproxy

Server-side Proxy for Pyrrha Boxchain Explorer

## Initial setup
Requires node.js version 9 and up
```sh
npm i
git submodule update --init --recursive --remote
```

## Config
Local configuration file is placed in folder ./config  
Also, can be used following environment vars:
- WEB3_PROTOCOL
- WEB3_HOSTNAME
- WEB3_PORT
- PAN_ADDRESS
- MARKET_ADDRESS

Currently deployed instances of contracts can be found by this link:
https://github.com/pandoraboxchain/pyrrha-consensus/wiki

## Using with Docker
Environment configuration is in the ./docker-compose.yml

Building:
```sh
npm run build:docker
```

Starting:
```sh
npm run start:docker
```

Stopping:
```sh
npm run stop:docker
```
## Running tests  
Tests and coverage results will be deployed to codacy and available on [Codacy Dashboard](https://www.codacy.com/app/kostysh/pyrrha-boxproxy?utm_source=github.com&utm_medium=referral&utm_content=pandoraboxchain/pyrrha-boxproxy&utm_campaign=Badge_Coverage)

For testing without coverage report use:
```sh
npm test
```
For generating and updating a code coverage report use:
```sh
npm run test-with-coverage
```