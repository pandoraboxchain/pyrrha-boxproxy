const config = require('../config/config-dev.json');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider(config.node_url));

import PandoraABI from '../pandora-abi/Pandora.json';
import WorkerNodeABI from '../pandora-abi/WorkerNode.json';
import CognitiveJobABI from '../pandora-abi/CognitiveJob.json';

const serPanABI = PandoraABI.abi;
const serWorABI = WorkerNodeABI.abi;
const serCogABI = CognitiveJobABI.abi;

const pandoraContractAddr = config.pandoraContractAddress;

const PANContract = web3.eth.contract(serPanABI).at(pandoraContractAddr);
const WORContract = web3.eth.contract(serWorABI).at(pandoraContractAddr);
const COGContract = web3.eth.contract(serCogABI).at(pandoraContractAddr);

export function getWorkers() {
  let workerNodesCount = PANContract.workerNodesCount();
  let workersList = [];
  for (let _count=0; _count < workerNodesCount; _count++) {
      let jobsActive = PANContract.activeJobs(_count);
      let singleWorker = {
          'id': _count,
          'address': PANContract.workerNodes(_count),
          'status': Number.parseInt(WORContract.currentState([_count])),
          'currentJob': jobsActive,
          'currentJobStatus': Number.parseInt(COGContract.currentState([jobsActive]))
      };
      workersList.push(singleWorker);
  }
  return workersList;
}

export function getJobs() {
  let workerNodesCount = PANContract.workerNodesCount();
  let jobsList = [];
  for (let _count=0; _count < workerNodesCount; _count++) {
      let jobsActive = PANContract.activeJobs(_count);
      let singleJob = {
          'id': _count,
          'jobAddress': PANContract.activeJobs(_count),
          'jobStatus': Number.parseInt(COGContract.currentState([jobsActive])),
          'ipfs': 'ipfsString'
      };
      jobsList.push(singleJob);
  }

  return jobsList;
}

export function getKernels() {
  let workerNodesCount = PANContract.workerNodesCount();
  let kernelsList = [];
  for (let _count=0; _count < workerNodesCount; _count++) {
      let kernel = {
          'kernel': _count,
          'redis': 'redis'
      };
      kernelsList.push(kernel);
  }

  return kernelsList;
}

export function getDatasets() {
  let workerNodesCount = PANContract.workerNodesCount();
  let datasetsList = [];
  for (let _count=0; _count < workerNodesCount; _count++) {
      let dataset = {
          'dataset': _count,
          'redis': 'redis'
      };
      datasetsList.push(dataset);
  }

  return datasetsList;
}
