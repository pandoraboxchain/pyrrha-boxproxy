'use strict';
// For better PM2 experience
process.on('uncaughtException', (err) => {
    console.log('An error has occured', err);
    process.exit(1);
});

// For the Pjs pleasure
global.window = {};

const config = require('../config');
const store = require('./store');
const Pjs = require('pyrrha-js');

// Contracts APIs
const Pandora = require('../pandora-abi/Pandora.json');
const PandoraMarket = require('../pandora-abi/PandoraMarket.json');
const WorkerNode = require('../pandora-abi/WorkerNode.json');
const CognitiveJob = require('../pandora-abi/CognitiveJob.json');
const Kernel = require('../pandora-abi/Kernel.json');
const Dataset = require('../pandora-abi/Dataset.json');

// Init servers
const wsServer = require('./ws')(config);
const app = require('./express')(config);

const pjs = new Pjs({
    eth: {
        protocol: config.protocol,
        host: config.nodeHost,
        port: config.nodePort
    },
    contracts: {
        Pandora,
        PandoraMarket,
        WorkerNode,
        CognitiveJob,
        Kernel,
        Dataset
    },
    addresses: {
        pandora: config.pandoraAddress,
        market: config.marketAddress
    }
});

// Set global app variables
store.set('web3', pjs.api.web3);
store.set('ws', wsServer);
store.set('pjs', pjs);

// Init RESTful and WS APIs
require('./routes')(app);
require('./wsapi')(wsServer);

module.exports = app;
