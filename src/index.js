'use strict';
// For better PM2 experience
process.on('uncaughtException', (err) => {
    console.log('An error has occured', err);
    process.exit(1);
});

const config = require('../config');
const Web3 = require('web3');
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
const web3 = new Web3(`${config.protocol || 'http'}://${config.nodeHost || 'localhost'}:${config.nodePort || ''}`);
const wsServer = require('./ws')(config);
const app = require('./express')(config);

const pjs = new Pjs({
    web3,
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
store.set('web3', web3);
store.set('ws', wsServer);
store.set('pjs', pjs);

// Init RESTful and WS APIs
require('./routes')(app);
require('./wsapi')(wsServer);

module.exports = app;
