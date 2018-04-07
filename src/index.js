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
const Pandora = require('../pyrrha-consensus/build/contracts/Pandora.json');
const PandoraMarket = require('../pyrrha-consensus/build/contracts/PandoraMarket.json');
const WorkerNode = require('../pyrrha-consensus/build/contracts/WorkerNode.json');
const CognitiveJob = require('../pyrrha-consensus/build/contracts/CognitiveJob.json');
const Kernel = require('../pyrrha-consensus/build/contracts/Kernel.json');
const Dataset = require('../pyrrha-consensus/build/contracts/Dataset.json');

// Init servers
const wsServer = require('./ws')(config);
const app = require('./express')(config);

const pjs = new Pjs({
    eth: {
        provider: new Pjs.Web3.providers.WebsocketProvider(`ws://${config.nodeHost}:${config.nodePort}`)
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
        Pandora: config.pandoraAddress,
        PandoraMarket: config.marketAddress
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
