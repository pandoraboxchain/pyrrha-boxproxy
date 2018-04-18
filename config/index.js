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
            Pandora: '0x74e9868e21b2c05643414a4e12ebda93f986c94f',
            PandoraMarket: '0xfbc0dd4dd5c4d45e0962a92bbca0f52954418dc5'
        }
    },
    rinkeby: {
        protocol: 'ws', // 'http',
        host: 'rinkeby.pandora.network',
        port: 8546,
        contracts: {
            Pandora: '0x9f301cfd1217fd60e4244a12b1edffe458e8b9bd',
            PandoraMarket: '0xaff19fee75b1443b41f0acbf54c83e2dab57eb82'
        }
    }
};

let defaultHost = process.env.USE_HOST || 'rinkeby';

module.exports = {
    port: 1111,
    wsport: 1337,
    wstimeout: 5000,
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
    }
};
