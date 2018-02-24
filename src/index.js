'use strict';
// For better PM2 experience
process.on('uncaughtException', (err) => {
    console.log('An error has occured', err);
    process.exit(1);
});

const config = require('../config');
const Web3 = require('web3');
const store = require('./store');

// Contracts APIs
const PandoraABI = require('../pandora-abi/Pandora.json');
const WorkerNodeABI = require('../pandora-abi/WorkerNode.json');
const CognitiveJobABI = require('../pandora-abi/CognitiveJob.json');
const KernelABI = require('../pandora-abi/Kernel.json');
const DatasetABI = require('../pandora-abi/Dataset.json');

// Init servers
const web3 = new Web3(`${config.protocol || 'http'}://${config.nodeHost || 'localhost'}:${config.nodePort || ''}`);
const wsServer = require('./ws')(config);
const app = require('./express')(config);

// ABI's
const abis = {
    pan: PandoraABI.abi,
    wor: WorkerNodeABI.abi,
    cog: CognitiveJobABI.ab,
    ker: KernelABI.abi,
    dat: DatasetABI.abi
};

// Contracts
const contracts = {
    pan: new web3.eth.Contract(abis.pan, config.pandoraAddress)
};

// Set global app variables
store.set('web3', web3);
store.set('ws', wsServer);
store.set('abis', abis);
store.set('contracts', contracts);

// Init RESTful API
require('./routes')(app);

module.exports = app;
