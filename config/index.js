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
            pan: '0x49e429ec1199d077b1f2ae8b6100b220f56401ef',
            economic: '0xf70a24b04e6b59eb6af9bd176e1ee24a97fa1961',
            pandora: '0x044662dfbfa067dd603f54b900cc157b9d6618d4',
            market: '0xc20e1435e654fbac8d7ed557ee424ab876d4f463'
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
            pan: '0x49e429ec1199d077b1f2ae8b6100b220f56401ef',
            economic: '0xf70a24b04e6b59eb6af9bd176e1ee24a97fa1961',
            pandora: '0x044662dfbfa067dd603f54b900cc157b9d6618d4',
            market: '0xc20e1435e654fbac8d7ed557ee424ab876d4f463'
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
            pan: '0x49e429ec1199d077b1f2ae8b6100b220f56401ef',
            economic: '0xf70a24b04e6b59eb6af9bd176e1ee24a97fa1961',
            pandora: '0x044662dfbfa067dd603f54b900cc157b9d6618d4',
            market: '0xc20e1435e654fbac8d7ed557ee424ab876d4f463'
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
