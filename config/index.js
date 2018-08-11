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
            Pandora: '0x9561c133dd8580860b6b7e504bc5aa500f0f06a7',
            PandoraMarket: '0x2612af3a521c2df9eaf28422ca335b04adf3ac66'
        }
    },
    rinkeby: {
        protocol: 'ws', // 'http',
        host: 'rinkeby.pandora.network',
        port: 8546,
        wstimeout: 5000,
        contracts: {
            Pandora: '0x09dc2389c786490c2fe03f121b6f597bac7773d9',
            PandoraMarket: '0xd66f0550800ec823e7359e755f6c4f16e62e555b'
        }
    },
    rinkeby_infura: {
        protocol: 'wss',
        host: 'rinkeby.infura.io/ws',
        port: 8546,
        wstimeout: 5000,
        contracts: {
            Pandora: '0x09dc2389c786490c2fe03f121b6f597bac7773d9',
            PandoraMarket: '0xd66f0550800ec823e7359e755f6c4f16e62e555b'
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
