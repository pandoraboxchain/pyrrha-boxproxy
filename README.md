## PandoraBoxChain BoxProxy

Server-side Proxy for Pyrrha Boxchain Explorer

### Initial setup
Requires node.js version 9 and up
```sh
npm i
git submodule update --init --recursive
```

### Config
Local configuration file is placed in folder ./config  
Also, can be used following environment vars:
- WEB3_PROTOCOL
- WEB3_HOSTNAME
- WEB3_PORT
- PAN_ADDRESS
- MARKET_ADDRESS

Currently deployed instances of contracts can be found by this link:
https://github.com/pandoraboxchain/pyrrha-consensus/wiki

### Using with Docker
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
