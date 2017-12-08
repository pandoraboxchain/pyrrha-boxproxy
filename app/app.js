const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const config = require('../config/config-dev.json');
const app = express();

//import config from '../config/config-dev.json';

const web3 = new Web3(new Web3.providers.HttpProvider(config.node_url));

import PandoraABI from '../pandora-abi/Pandora.json';
import WorkerNodeABI from '../pandora-abi/WorkerNode.json';
import CognitiveJobABI from '../pandora-abi/CognitiveJob.json';

import { getWorkers, getJobs, getKernels, getDatasets } from './function.js';

// ABI's

const serPanABI = PandoraABI.abi;
const serWorABI = WorkerNodeABI.abi;
const serCogABI = CognitiveJobABI.abi;

const pandoraContractAddr = config.pandoraContractAddress;

const PANContract = web3.eth.contract(serPanABI).at(pandoraContractAddr);
const WORContract = web3.eth.contract(serWorABI).at(pandoraContractAddr);
const COGContract = web3.eth.contract(serCogABI).at(pandoraContractAddr);

const port = config.port;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.listen(port, () => {
    console.log('Server running at '+port+' port');
});

app.get('/', (req, res) => {
    res.send('Empty GET!')
});

app.get('/store', (req, res) => {
  let workers = getWorkers();
  let jobs = getJobs();
  let kernels = getKernels();
  let datasets = getDatasets();
  let store = {
    workers,
    jobs,
    kernels,
    datasets
  };
  res.json(store);
});

app.get('/abi', (req, res) => {
    return res.json(finABI);
});
