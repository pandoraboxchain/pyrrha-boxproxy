'use strict';

// Contracts APIs
const Pandora = require('../pyrrha-consensus/build/contracts/Pandora.json');
const PandoraMarket = require('../pyrrha-consensus/build/contracts/PandoraMarket.json');
const WorkerNode = require('../pyrrha-consensus/build/contracts/WorkerNode.json');
const CognitiveJob = require('../pyrrha-consensus/build/contracts/CognitiveJob.json');
const Kernel = require('../pyrrha-consensus/build/contracts/Kernel.json');
const Dataset = require('../pyrrha-consensus/build/contracts/Dataset.json');

const hosts = {
    default: {
        protocol: 'ws',
        host: 'localhost',
        port: 8545,
        contracts: {
            Pandora: '0x9561c133dd8580860b6b7e504bc5aa500f0f06a7',
            PandoraMarket: '0x2612af3a521c2df9eaf28422ca335b04adf3ac66'
        }
    },
    rinkeby: {
        protocol: 'ws', // 'http',
        host: 'rinkeby.pandora.network',
        port: 8546,
        contracts: {
            Pandora: '0x9ac5265030f55b594198443db41684e0f65ce1b3',
            PandoraMarket: '0x5fafdfed7ed553716e877961d41ca3fae6a40c35'
        }
    },
    rinkeby_infura: {
        protocol: 'wss',
        host: 'rinkeby.infura.io/ws',
        port: 8546,
        contracts: {
            Pandora: '0x9ac5265030f55b594198443db41684e0f65ce1b3',
            PandoraMarket: '0x5fafdfed7ed553716e877961d41ca3fae6a40c35'
        }
    }
};

let defaultHost = process.env.USE_HOST || 'rinkeby';

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
        WorkerNode,
        CognitiveJob,
        Kernel,
        Dataset
    },
    addresses: {
        Pandora: process.env.PAN_ADDRESS || hosts[defaultHost].contracts.Pandora,
        PandoraMarket: process.env.MARKET_ADDRESS || hosts[defaultHost].contracts.PandoraMarket
    },
    database: {}
};
