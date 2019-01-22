'use strict';

// Contracts APIs
const Pandora = require('../pyrrha-consensus/build/contracts/Pandora.json');
const PandoraMarket = require('../pyrrha-consensus/build/contracts/PandoraMarket.json');
const CognitiveJobController = require('../pyrrha-consensus/build/contracts/CognitiveJobController.json');
const EconomicController = require('../pyrrha-consensus/build/contracts/EconomicController.json');
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
            pan: '0xa40600efcb9b69003757fb196304858f989888a1',
            economic: '0x3c2f60a3c1dba316c1031925712339f694f0da99',
            pandora: '0x2ac8d321cdfdc1fa5591a38ee2c2bcbe094b64d7',
            market: '0xfd4158c461df6295229e23c7686f8684a0d26531'
        },
        ipfs: {
            protocol: 'http',
            host: 'localhost',
            port: 5001
        }
    },
    rinkeby: {
        protocol: 'wss',
        host: 'rinkeby.pandora.network/ws',
        port: '',
        net: 4,
        wstimeout: 5000,
        contracts: {
            pan: '0xa40600efcb9b69003757fb196304858f989888a1',
            economic: '0x3c2f60a3c1dba316c1031925712339f694f0da99',
            pandora: '0x2ac8d321cdfdc1fa5591a38ee2c2bcbe094b64d7',
            market: '0xfd4158c461df6295229e23c7686f8684a0d26531'
        },
        ipfs: {
            protocol: 'http',
            host: 'ipfs.pandora.network',
            port: 5001
        }
    },
    rikebyinfura: {
        protocol: 'wss',
        host: 'rinkeby.infura.io/ws',
        port: '',
        wstimeout: 5000,
        contracts: {
            pan: '0xa40600efcb9b69003757fb196304858f989888a1',
            economic: '0x3c2f60a3c1dba316c1031925712339f694f0da99',
            pandora: '0x2ac8d321cdfdc1fa5591a38ee2c2bcbe094b64d7',
            market: '0xfd4158c461df6295229e23c7686f8684a0d26531'
        },
        ipfs: {
            protocol: 'http',
            host: 'ipfs.pandora.network',
            port: 5001
        }
    }
};

let defaultHost = process.env.USE_HOST || 'rikebyinfura';

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
        EconomicController,
        WorkerNode,
        Kernel,
        Dataset
    },
    addresses: {
        Pan:  process.env.PAN_ADDRESS || hosts[defaultHost].contracts.pan,
        Pandora: process.env.PANDORA_ADDRESS || hosts[defaultHost].contracts.pandora,
        EconomicController: process.env.ECONOMIC_ADDRESS || hosts[defaultHost].contracts.economic,
        PandoraMarket: process.env.MARKET_ADDRESS || hosts[defaultHost].contracts.market
    },
    database: {
        pagination: {
            limit: 5
        }
    }
};
