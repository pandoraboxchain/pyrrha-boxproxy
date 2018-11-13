'use strict';

// Contracts APIs
const Pandora = require('../pyrrha-consensus/build/contracts/Pandora.json');
const PandoraMarket = require('../pyrrha-consensus/build/contracts/PandoraMarket.json');
const CognitiveJobController = require('../pyrrha-consensus/build/contracts/CognitiveJobController.json');
const WorkerNode = require('../pyrrha-consensus/build/contracts/WorkerNode.json');
const Kernel = require('../pyrrha-consensus/build/contracts/Kernel.json');
const Dataset = require('../pyrrha-consensus/build/contracts/Dataset.json');

const hosts = {
    default: {
        protocol: 'ws',
        host: 'localhost',
        port: 8545,
        wstimeout: 5000,
        contracts: {
            Pandora: '',
            PandoraMarket: ''
        }
    },
    rinkeby: {
        protocol: 'ws', // 'http',
        host: 'rinkeby.pandora.network',
        port: 8546,
        wstimeout: 5000,
        contracts: {
            Pandora: '',
            PandoraMarket: ''
        }
    },
    rinkeby_infura: {
        protocol: 'wss',
        host: 'rinkeby.infura.io/ws',
        port: 8546,
        wstimeout: 5000,
        contracts: {
            Pandora: '',
            PandoraMarket: ''
        }
    },
    rsktest: {
        protocol: 'ws',
        host: 'node.rsk.pandora.network',
        port: 4445,
        wstimeout: 5000,
        contracts: {
            Pandora: '0xcdca0f85f696a8a8d70a6ecd74236690548bf44b',
            PandoraMarket: '0x55da07dbb7c76cb6be03f6ab6669626a83ec250d'
        }
    }
};

let defaultHost = process.env.USE_HOST || 'rsktest';

module.exports = {
    port: 1111,
    wsport: 1337,
    wstimeout: hosts[defaultHost].wstimeout || 5000,
    protocol: process.env.WEB3_PROTOCOL || hosts[defaultHost].protocol,
    nodePort: process.env.WEB3_PORT || hosts[defaultHost].port,
    nodeHost: process.env.WEB3_HOSTNAME || hosts[defaultHost].host,
    contracts: {
        Pandora,
        PandoraMarket,
        CognitiveJobController,
        WorkerNode,
        Kernel,
        Dataset
    },
    addresses: {
        Pandora: process.env.PAN_ADDRESS || hosts[defaultHost].contracts.Pandora,
        PandoraMarket: process.env.MARKET_ADDRESS || hosts[defaultHost].contracts.PandoraMarket
    },
    database: {
        pagination: {
            limit: 5
        }
    }
};
