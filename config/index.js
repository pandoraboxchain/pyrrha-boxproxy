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
        contracts: {
            Pandora: '0x41ceb4bd1b8abeb1b036f7448a8a3a525fb5de56',
            PandoraMarket: '0x019ccc2e2789eb3ddeed50caab32b408ac18969b'
        }
    },
    rinkeby: {
        protocol: 'ws', // 'http',
        host: 'rinkeby.pandora.network',
        port: 8546,
        contracts: {
            Pandora: '0xf31b5318cfefcf8d661508b3e12f861aa160ca3b',
            PandoraMarket: '0x6b73053425d5ec272e44ced005dc5f7d80d346e2'
        }
    },
    rinkeby_infura: {
        protocol: 'wss',
        host: 'rinkeby.infura.io/ws',
        port: 8546,
        contracts: {
            Pandora: '0xf31b5318cfefcf8d661508b3e12f861aa160ca3b',
            PandoraMarket: '0x6b73053425d5ec272e44ced005dc5f7d80d346e2'
        }
    }
};

let defaultHost = process.env.USE_HOST || 'infura_rinkeby';

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
