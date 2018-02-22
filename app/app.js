const express = require('express');
const bodyParser = require('body-parser');
const Web3 = require('web3');
const config = require('../config/config-dev');
const app = express();

process.on('uncaughtException', function (e) {
    console.log('An error has occured. Process will restart now.');
    process.exit(1);
})

const web3 = new Web3(config.node_url);//new Web3.providers.HttpProvider(config.node_url));

const PandoraABI = require('../pandora-abi/PandoraHooks.json');
const WorkerNodeABI = require('../pandora-abi/WorkerNode.json');
const CognitiveJobABI = require('../pandora-abi/CognitiveJob.json');

const { getWorkers, getJobs, getKernels, getDatasets } = require('./function.js');
const { wsServer } = require('./ws.js');
// ABI's

const serPanABI = PandoraABI.abi;
const serWorABI = WorkerNodeABI.abi;
const serCogABI = CognitiveJobABI.abi;

const pandoraContractAddr = config.pandoraContractAddress;

const PANContract = new web3.eth.Contract(serPanABI, pandoraContractAddr);

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
    return res.json({
        serPanABI,
        serWorABI,
        serCogABI
    });
});

app.get('/workers', (req, res) => {

    getWorkers()
        .then(workers => {
            
            let response = {
                'workers': workers,
                'workersTotal': workers.length
            };

            return res.json(response);
        })
        .catch(err => {
            res.json({
                error: err.message || 'Unknown error'
            });
        });
});

app.get('/workers/:id', (req, res) => {

    PANContract.methods
        .workerNodesCount()
        .call()
        .then(workerNodesCount => {

            if (req.params.id >= workerNodesCount) {
                res.json({
                    error: 'Invalid worker ID!'
                });
            } else {
                let jobsActive = PANContract.activeJobs(req.params.id);
                let worker = {
                    'id': Number.parseInt(req.params.id),
                    'address': PANContract.workerNodes(req.params.id),
                    'status': Number.parseInt(WORContract.currentState([req.params.id])),
                    'currentJob': jobsActive,
                    'currentJobStatus': Number.parseInt(COGContract.currentState([jobsActive]))
                };
                return res.json(worker);
            }
        })
        .catch(err => {
            res.json({
                error: err
            });
        });    
});

app.get('/jobs', (req, res) => {
        
    PANContract.methods
        .workerNodesCount()
        .call()
        .then(workerNodesCount => {

            let jobsList = [];
            for (let _count = 0; _count < workerNodesCount; _count++) {
                let jobsActive = PANContract.activeJobs(_count);
                let singleJob = {
                    'id': _count,
                    'jobAddress': PANContract.activeJobs(_count),
                    'jobStatus': Number.parseInt(COGContract.currentState([jobsActive])),
                    'ipfs': 'ipfsString'
                };
                jobsList.push(singleJob);
            }
            let jobs = {
                'jobs': jobsList
            };
            return res.json(jobs);
        })
        .catch(err => {
            res.json({
                error: err
            });
        });
});

app.get('/kernels', (req, res) => {
    
    PANContract.methods
        .workerNodesCount()
        .call()
        .then(workerNodesCount => {

            let jobsList = [];
            for (let _count = 0; _count < workerNodesCount; _count++) {
                let jobsActive = PANContract.activeJobs(_count);
                let singleJob = {
                    'id': _count,
                    'jobAddress': PANContract.activeJobs(_count),
                    'jobStatus': Number.parseInt(COGContract.currentState([jobsActive])),
                    'ipfs': 'ipfsString'
                };
                jobsList.push(singleJob);
            }
            let jobs = {
                'jobs': jobsList
            };
            return res.json(jobs);
        })
        .catch(err => {
            res.json({
                error: err
            });
        });    
});

app.get('/datasets', (req, res) => {

    PANContract.methods
        .workerNodesCount()
        .call()
        .then(workerNodesCount => {

            let jobsList = [];
            for (let _count = 0; _count < workerNodesCount; _count++) {
                let jobsActive = PANContract.activeJobs(_count);
                let singleJob = {
                    'id': _count,
                    'jobAddress': PANContract.activeJobs(_count),
                    'jobStatus': Number.parseInt(COGContract.currentState([jobsActive])),
                    'ipfs': 'ipfsString'
                };
                jobsList.push(singleJob);
            }
            let jobs = {
                'jobs': jobsList
            };
            return res.json(jobs);
        })
        .catch(err => {
            res.json({
                error: err
            });
        });
});
