const config = require('../config/config-dev.json');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider(config.node_url));

import PandoraABI from '../pandora-abi/PandoraHooks.json';
import WorkerNodeABI from '../pandora-abi/WorkerNode.json';
import CognitiveJobABI from '../pandora-abi/CognitiveJob.json';
import KernelABI from '../pandora-abi/Kernel.json';
import DatasetABI from '../pandora-abi/Dataset.json';

import { pushToWS } from './ws.js'

const serPanABI = PandoraABI.abi;
const serWorABI = WorkerNodeABI.abi;
const serCogABI = CognitiveJobABI.abi;
const serKerABI = KernelABI.abi;
const serDatABI = DatasetABI.abi;

const pandoraContractAddr = config.pandoraContractAddress;
const PANContract = web3.eth.contract(serPanABI).at(pandoraContractAddr);

export function getWorkers() {
  let workerNodesCount = PANContract.workerNodesCount();
  let workersList = [];
  for (let _count=0; _count < workerNodesCount; _count++) {
    let workerAddress = PANContract.workerNodes(_count);
    let WORContract = web3.eth.contract(serWorABI).at(workerAddress)
    let jobAddress = WORContract.activeJob()
    let COGContract = (jobAddress == null) ? null : web3.eth.contract(serCogABI).at(jobAddress)
    let singleWorker = {
      'id': _count,
      'address': workerAddress,
      'status': Number.parseInt(WORContract.currentState()),
      'currentJob': jobAddress,
      'currentJobStatus': jobAddress ? -1 : Number.parseInt(COGContract.currentState())
    };
    workersList.push(singleWorker);
  }
  return workersList;
}

export function getJobs() {
  let jobsCount = PANContract.activeJobsCount();
  let jobsList = [];
  for (let _count=0; _count < jobsCount; _count++) {
      let jobAddress = PANContract.activeJobs(_count);
      let COGContract = web3.eth.contract(serCogABI).at(jobAddress)
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

export function getKernels() {
  let kernelMapping = {}
  let jobs = getJobs()
  let _count = 0
  jobs.map(job => {
      let COGContract = web3.eth.contract(serCogABI).at(job['jobAddress'])
      kernelMapping[COGContract.kernel()] = true
  })
  return Object.keys(kernelMapping).map(kernelAddress => {
      let KERContract = web3.eth.contract(serKerABI).at(kernelAddress)
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

export function getDatasets() {
  let datasetMapping = {}
  let jobs = getJobs()
  let _count = 0
  jobs.map(job => {
    let COGContract = web3.eth.contract(serCogABI).at(job['jobAddress'])
    datasetMapping[COGContract.dataset()] = true
  })
  return Object.keys(datasetMapping).map(datasetAddress => {
    let DATContract = web3.eth.contract(serDatABI).at(datasetAddress)
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

export function setEvents(push) {
  /*PANContract.WorkerNodeCreated({fromBlock: 0}, function(err, res){
    console.log(res);
    console.log(err);
  });*/
  PANContract.CognitiveJobCreated({fromBlock: 0}, function(err, res){
    if(!err){
      let jobAddress = res.args.cognitiveJob;
      let COGContract = web3.eth.contract(serCogABI).at(jobAddress)
      let job = {
          'jobAddress': jobAddress,
          'jobStatus': Number.parseInt(COGContract.currentState()),
          'kernel': COGContract.kernel(),
          'dataset': COGContract.dataset(),
          'type': 'created',
      };
      COGContract.StateChanged({fromBlock: 0}, function(err, res){
        if(!err){
          let jobAddress = res.address;
          let COGContract = web3.eth.contract(serCogABI).at(jobAddress)
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
      let KERContract = web3.eth.contract(serKerABI).at(kernelAddress)
      let kernel = {
        'address': kernelAddress,
        'ipfs': KERContract.ipfsAddress(),
        'dim': KERContract.dataDim(),
        'price': KERContract.currentPrice(),
        'complexity': KERContract.complexity()
      }
      let datasetAddress = COGContract.dataset()
      let DATContract = web3.eth.contract(serDatABI).at(datasetAddress)
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
