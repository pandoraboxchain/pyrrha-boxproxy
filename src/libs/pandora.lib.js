'use strict';
const store = require('../store');
const web3 = store.get('web3');
const { pan } = store.get('contracts');
const { 
    wor: worAbi, 
    cog: cogAbi,
    dat: datAbi,
    ker: kerAbi
} = store.get('abis');

///////////////////////////////////////
//
// Common methods
//
///////////////////////////////////////

/**
 * Get worker nodes count from Pandora contract
 * 
 * @returns {integer} 
 */
const getWorkerNodesCount = async () => {
    const count = await pan.methods
        .workerNodesCount()
        .call();
    return count;
};

/**
 * Get worker address from Pandora contract by the worker Id
 * 
 * @param {integer} id Worker Id
 * @returns {string} 
 */
const getWorkerAddressById = async (id) => {
    const address = await pan.methods
        .workerNodes(id)
        .call()
    return address;
};

///////////////////////////////////////
//
// Jobs related methods
//
///////////////////////////////////////

/**
 * Get active job address from Pandora contract by worker id
 * 
 * @param {integer} id 
 * @returns {string}
 */
const getJobAddressByWorkerId = async () => {
    const wor = new web3.eth.Contract(worAbi, address);
    const job = await wor.methods
        .activeJob()
        .call();
    return job;
};

/**
 * Get active job address from Worker contract by the worker address
 * 
 * @param {string} address 
 * @returns {string} 
 */
const getJobAddressByWorkerAddress = async (address) => {
    const wor = new web3.eth.Contract(worAbi, address);
    const job = await wor.methods
        .activeJob()
        .call();
    return job;
};

/**
 * Get job state from CognitiveJob contract by the job address
 * 
 * @param {string} address 
 * @returns {integer} 
 */
const getJobStateByJobAddress = async (address) => {
    const cog = new web3.eth.Contract(cogAbi, address);
    const state = await cog.methods
        .currentState()
        .call();
    return state;
};

/**
 * Get all jobs
 * 
 * @returns {Object[]} 
 */
const getJobs = async () => {

    const count = await getWorkerNodesCount();
    let jobs = [];

    for (let i=0; i < count; i++) {

        const activeJob = await getJobAddressByWorkerId(i);
        const jobState = await getJobStateByJobAddress(activeJob);
        
        jobs.push({
            id: i,
            jobAddress: activeJob,
            jobStatus: jobState,
            ipfs: 'ipfsString'// @todo Get ipfs url
        });
    }

    return jobs;
};

///////////////////////////////////////
//
// Workers related methods
//
///////////////////////////////////////

/**
 * Get worker state from Worker contract by the worker address
 * 
 * @param {string} address 
 * @returns {integer}
 */
const getWorkerStateByWorkerAddress = async (address) => {
    const wor = new web3.eth.Contract(worAbi, address);
    const state = await wor.methods
        .currentState()
        .call();
    return state;
};

/**
 * Get worker by the worker`s id
 * 
 * @param {integer} id 
 * @returns {integer}
 */
const getWorkerById = async (id) => {
    const count = await getWorkerNodesCount();

    if (id >= count) {

        const err = new Error('Worker not found');
        err.code = 404;
        return next(err);
    }

    const workerAddress = await getWorkerAddressById(id);
    const workerState = await getWorkerStateByWorkerAddress(workerAddress);
    const jobAddress = await getJobAddressByWorkerId(id);
    const jobState = await getJobStateByJobAddress(jobAddress);

    return {
        id: Number.parseInt(id),
        address: workerAddress,
        status: Number.parseInt(workerState),
        currentJob: activeJob,
        currentJobStatus: jobState || -1
    };
};

/**
 * Get all workers
 * 
 * @returns {integer}
 */
const getWorkers = async () => {
    const count = await getWorkerNodesCount();
    let workers = [];

    for (let i = 0; i < count; i++) {

        const worker = await getWorkerById(i);
        workers.push(worker);
    }

    return workers;
};

///////////////////////////////////////
//
// Datasets related methods
//
///////////////////////////////////////

/**
 * Get dataset address from Cognitive contract by the job
 * 
 * @param {Object} job
 * @returns {string}
 */
const getDatasetAddressByJob = async (job) => {
    const cog = new web3.eth.Contract(cogAbi, job);
    const address = await cog.methods
        .dataset()
        .call();
    return address;
};

/**
 * Get IPFS address from Dataset contract by the dataset address
 * 
 * @param {string} address
 * @returns {string}
 */
const getIpfsAddressByDatasetAddress = async (address) => {
    const dat = new web3.eth.Contract(datAbi, address);
    const ipfsAddress = await dat.methods
        .ipfsAddress()
        .call();
    return ipfsAddress;
};

/**
 * Get data dim from Dataset contract by the dataset address
 * 
 * @param {string} address
 * @returns {integer}
 */
const getDataDimByDatasetAddress = async (address) => {
    const dat = new web3.eth.Contract(datAbi, address);
    const dataDim = await dat.methods
        .dataDim()
        .call();
    return dataDim;
};

/**
 * Get current price from Dataset contract by the dataset address
 * 
 * @param {string} address
 * @returns {integer}
 */
const getCurrentPriceByDatasetAddress = async (address) => {
    const dat = new web3.eth.Contract(datAbi, address);
    const currentPrice = await dat.methods
        .currentPrice()
        .call();
    return currentPrice;
};

/**
 * Get data samples count from Dataset contract by the dataset address
 * 
 * @param {string} address
 * @returns {integer}
 */
const getSamplesCountByDatasetAddress = async (address) => {
    const dat = new web3.eth.Contract(datAbi, address);
    const samplesCount = await dat.methods
        .samplesCount()
        .call();
    return samplesCount;
};

/**
 * Get data batches count from Dataset contract by the dataset address
 * 
 * @param {string} address
 * @returns {integer}
 */
const getBatchesCountByDatasetAddress = async (address) => {
    const dat = new web3.eth.Contract(datAbi, address);
    const batchesCount = await dat.methods
        .batchesCount()
        .call();
    return batchesCount;
};

/**
 * Get all datasets
 * 
 * @returns {Object[]}
 */
const getDatasets = async () => {    
    const jobs = await getJobs();

    const datasets = await Promise.all(jobs.map(async (jobAddress, index) => {
        const datasetAddress = await getDatasetAddressByJob(jobAddress);
        const ipfsAddress = await getIpfsAddressByDatasetAddress(datasetAddress);
        const dataDim = await getDataDimByDatasetAddress(datasetAddress);
        const currentPrice = await getCurrentPriceByDatasetAddress(datasetAddress);
        const samplesCount = await getSamplesCountByDatasetAddress(datasetAddress);
        const batchesCount = await getBatchesCountByDatasetAddress(datasetAddress);
        
        return {
            id: index,
            address: datasetAddress,
            ipfs: ipfsAddress,
            dim: dataDim,
            price: currentPrice,
            samples: samplesCount,
            batches: batchesCount
        };
    }));
};

///////////////////////////////////////
//
// Kernels related methods
//
///////////////////////////////////////

/**
 * Get kernel address from Cognitive contract by the job
 * 
 * @param {Object} job
 * @returns {string}
 */
const getKernelAddressByJob = async (job) => {
    const cog = new web3.eth.Contract(cogAbi, job);
    const address = await cog.methods
        .kernel()
        .call();
    return address;
};

/**
 * Get IPFS address from Kernel contract by the kernel address
 * 
 * @param {string} address
 * @returns {string}
 */
const getIpfsAddressByKernelAddress = async (address) => {
    const ker = new web3.eth.Contract(kerAbi, address);
    const ipfsAddress = await ker.methods
        .ipfsAddress()
        .call();
    return ipfsAddress;
};

/**
 * Get data dim from Kernel contract by the kernel address
 * 
 * @param {string} address
 * @returns {integer}
 */
const getDataDimByKernelAddress = async (address) => {
    const ker = new web3.eth.Contract(kerAbi, address);
    const dataDim = await ker.methods
        .dataDim()
        .call();
    return dataDim;
};

/**
 * Get current price from Kernel contract by the kernel address
 * 
 * @param {string} address
 * @returns {integer}
 */
const getCurrentPriceByKernelAddress = async (address) => {
    const ker = new web3.eth.Contract(kerAbi, address);
    const currentPrice = await ker.methods
        .currentPrice()
        .call();
    return currentPrice;
};

/**
 * Get complexity from Kernel contract by the kernel address
 * 
 * @param {string} address
 * @returns {integer}
 */
const getComplexityByKernelAddress = async (address) => {
    const ker = new web3.eth.Contract(kerAbi, address);
    const complexity = await ker.methods
        .complexity()
        .call();
    return complexity;
};

/**
 * Get all kernels
 * 
 * @returns {Object[]} 
 */
const getKernels = async () => {

    const jobs = await getJobs();

    const kernels = await Promise.all(jobs.map(async (jobAddress, index) => {
        const kernelAddress = await exportsgetKernelAddressByJob(jobAddress);
        const ipfsAddress = await exportsgetIpfsAddressByKernelAddress(kernelAddress);
        const dataDim = await exportsgetDataDimByKernelAddress(kernelAddress);
        const currentPrice = await exportsgetCurrentPriceByKernelAddress(kernelAddress);
        const complexity = await exportsgetComplexityByKernelAddress(kernelAddress);

        return {
            id: index,
            address: kernelAddress,
            ipfs: ipfsAddress,
            dim: dataDim,
            price: currentPrice,
            complexity: complexity
        };
    }));

    return kernels;
};

///////////////////////////////////////
// 
// Exports
//
///////////////////////////////////////

module.exports.getWorkerNodesCount = getWorkerNodesCount;
module.exports.getWorkerAddressById = getWorkerAddressById;
module.exports.getJobAddressByWorkerId = getJobAddressByWorkerId;
module.exports.getJobAddressByWorkerAddress = getJobAddressByWorkerAddress;
module.exports.getJobStateByJobAddress = getJobStateByJobAddress;
module.exports.getJobs = getJobs;

module.exports.getWorkerStateByWorkerAddress = getWorkerStateByWorkerAddress;
module.exports.getWorkerById = getWorkerById;
module.exports.getWorkers = getWorkers;

module.exports.getDatasetAddressByJob = getDatasetAddressByJob;
module.exports.getIpfsAddressByDatasetAddress = getIpfsAddressByDatasetAddress;
module.exports.getDataDimByDatasetAddress = getDataDimByDatasetAddress;
module.exports.getCurrentPriceByDatasetAddress = getCurrentPriceByDatasetAddress;
module.exports.getSamplesCountByDatasetAddress = getSamplesCountByDatasetAddress;
module.exports.getBatchesCountByDatasetAddress = getBatchesCountByDatasetAddress;
module.exports.getDatasets = getDatasets;

module.exports.getKernelAddressByJob = getKernelAddressByJob;
module.exports.getIpfsAddressByKernelAddress = getIpfsAddressByKernelAddress;
module.exports.getDataDimByKernelAddress = getDataDimByKernelAddress;
module.exports.getCurrentPriceByKernelAddress = getCurrentPriceByKernelAddress;
module.exports.getComplexityByKernelAddress = getComplexityByKernelAddress;
module.exports.getKernels = getKernels;

