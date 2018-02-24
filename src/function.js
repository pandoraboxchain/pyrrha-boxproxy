const config = require('../config/config-dev');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider(config.node_url));

const PandoraABI = require('../pandora-abi/Pandora.json');
const WorkerNodeABI = require('../pandora-abi/WorkerNode.json');
const CognitiveJobABI = require('../pandora-abi/CognitiveJob.json');
const KernelABI = require('../pandora-abi/Kernel.json');
const DatasetABI = require('../pandora-abi/Dataset.json');

const { pushToWS } = require('./ws.js');

const serPanABI = PandoraABI.abi;
const serWorABI = WorkerNodeABI.abi;
const serCogABI = CognitiveJobABI.abi;
const serKerABI = KernelABI.abi;
const serDatABI = DatasetABI.abi;

const pandoraContractAddr = config.pandoraContractAddress;
const PANContract = new web3.eth.Contract(serPanABI, pandoraContractAddr);

function getWorkerById(id) {

}

function getWorkers() {
  
  return PANContract.methods
    .workerNodesCount()
    .call()
    .then(workerNodesCount => {

      let workersPromises = [];

      for (let _count = 0; _count < workerNodesCount; _count++) {

        workersPromises.push(
          PANContract.methods
            .workerNodes(_count)
            .call()
            .then(workerAddress => {

              let WORContract = new web3.eth.Contract(serWorABI, workerAddress);
              return WORContract.methods
                .activeJob()
                .call()
                .then(jobAddress => {

                  if (jobAddress) {

                    return WORContract.methods
                      .currentState()
                      .call()
                      .then(workerState => {

                        let COGContract = new web3.eth.Contract(serCogABI, jobAddress);
                        return COGContract.method
                          .currentState()
                          .call()
                          .then(jobState => {
                              _count,
                              workerAddress,
                              workerState
                              jobAddress,
                              jobState
                          });
                      });
                  }

                  return null;
                });
            })
        );        
      }

      return Promise.all(workersPromises);
    })
    .then(result => {

      let workersList = result.map(worker => {

        if (worker) {

          return {
            'id': worker._count,
            'address': worker.workerAddress,
            'status': Number.parseInt(worker.workerState),
            'currentJob': worker.jobAddress,
            'currentJobStatus': worker.jobAddress ? -1 : Number.parseInt(worker.jobState)
          }
        }

        return null;
      });

      return workersList.filter(worker => worker);
    });
}

function getJobs() {
  let jobsCount = PANContract.activeJobsCount();
  let jobsList = [];
  for (let _count = 0; _count < jobsCount; _count++) {
    let jobAddress = PANContract.activeJobs(_count);
    let COGContract = new web3.eth.Contract(serCogABI, jobAddress)
    let singleJob = {
      'id': _count,
      'jobAddress': jobAddress,
      'jobStatus': Number.parseInt(COGContract.currentState()),
      'kernel': COGContract.kernel(),
      'dataset': COGContract.dataset()
    };
    jobsList.push(singleJob);
  }

  return jobsList;
}

function getKernels() {
  let kernelMapping = {}
  let jobs = getJobs()
  let _count = 0
  jobs.map(job => {
    let COGContract = new web3.eth.Contract(serCogABI, job['jobAddress'])
    kernelMapping[COGContract.kernel()] = true
  })
  return Object.keys(kernelMapping).map(kernelAddress => {
    let KERContract = new web3.eth.Contract(serKerABI, kernelAddress)
    return {
      'id': _count++,
      'address': kernelAddress,
      'ipfs': KERContract.ipfsAddress(),
      'dim': KERContract.dataDim(),
      'price': KERContract.currentPrice(),
      'complexity': KERContract.complexity()
    }
  })
}

function getDatasets() {
  let datasetMapping = {}
  let jobs = getJobs()
  let _count = 0
  jobs.map(job => {
    let COGContract = new web3.eth.Contract(serCogABI, job['jobAddress'])
    datasetMapping[COGContract.dataset()] = true
  })
  return Object.keys(datasetMapping).map(datasetAddress => {
    let DATContract = new web3.eth.Contract(serDatABI, datasetAddress)
    return {
      'id': _count++,
      'address': datasetAddress,
      'ipfs': DATContract.ipfsAddress(),
      'dim': DATContract.dataDim(),
      'price': DATContract.currentPrice(),
      'samples': DATContract.samplesCount(),
      'batches': DATContract.batchesCount()
    }
  })
}

let workerNodesList = [];

function setEvents(push) {
  /*PANContract.WorkerNodeCreated({fromBlock: 0}, function(err, res){
    console.log(res);
    console.log(err);
  });*/
  PANContract.events.CognitiveJobCreated({ fromBlock: 0 }, function (err, res) {
    if (!err) {
      let jobAddress = res.args.cognitiveJob;
      let COGContract = new web3.eth.Contract(serCogABI, jobAddress)
      let job = {
        'jobAddress': jobAddress,
        'jobStatus': Number.parseInt(COGContract.currentState()),
        'kernel': COGContract.kernel(),
        'dataset': COGContract.dataset(),
        'type': 'created',
      };
      COGContract.events.StateChanged({ fromBlock: 0 }, function (err, res) {
        if (!err) {
          let jobAddress = res.address;
          let COGContract = new web3.eth.Contract(serCogABI, jobAddress)
          let job = {
            'jobAddress': jobAddress,
            'jobStatus': Number.parseInt(COGContract.currentState()),
            'kernel': COGContract.kernel(),
            'dataset': COGContract.dataset(),
            'type': 'changed',
          };
          push({
            'jobs': [job],
            'kernels': [],
            'datasets': [],
            'workers': [],
          });
        }
      });
      let kernelAddress = COGContract.kernel()
      let KERContract = new web3.eth.Contract(serKerABI, kernelAddress)
      let kernel = {
        'address': kernelAddress,
        'ipfs': KERContract.ipfsAddress(),
        'dim': KERContract.dataDim(),
        'price': KERContract.currentPrice(),
        'complexity': KERContract.complexity()
      }
      let datasetAddress = COGContract.dataset()
      let DATContract = new web3.eth.Contract(serDatABI, datasetAddress)
      let dataset = {
        'address': datasetAddress,
        'ipfs': DATContract.ipfsAddress(),
        'dim': DATContract.dataDim(),
        'price': DATContract.currentPrice(),
        'samples': DATContract.samplesCount(),
        'batches': DATContract.batchesCount()
      }
      push({
        'jobs': [job],
        'kernels': [kernel],
        'datasets': [dataset],
        'workers': [],
      });
    }
  });
}

setEvents(pushToWS)

module.exports.getWorkers = getWorkers;
module.exports.getJobs = getJobs;
module.exports.getKernels = getKernels;
module.exports.getDatasets = getDatasets;
module.exports.setEvents = setEvents;
