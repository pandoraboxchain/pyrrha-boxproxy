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
module.exports.getWorkerNodesCount = async () => {
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
module.exports.getWorkerAddressById = async (id) => {
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
module.exports.getJobAddressByWorkerId = async (id) => {
    const job = await pan.methods
        .activeJobs(id)
        .call();
    return job;
};

/**
 * Get active job address from Worker contract by the worker address
 * 
 * @param {string} address 
 * @returns {string} 
 */
module.exports.getJobAddressByWorkerAddress = async (address) => {
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
module.exports.getJobStateByJobAddress = async (address) => {
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
module.exports.getJobs = async () => {

    const count = await module.exports.getWorkerNodesCount();
    let jobs = [];

    for (let i=0; i < count; i++) {

        const activeJob = await module.exports.getJobAddressByWorkerId(i);
        const jobState = await module.exports.getJobStateByJobAddress(activeJob);
        
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
module.exports.getWorkerStateByWorkerAddress = async (address) => {
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
module.exports.getWorkerById = async (id) => {
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
module.exports.getWorkers = async () => {
    const count = await module.exports.getWorkerNodesCount();
    let workers = [];

    for (let i = 0; i < count; i++) {

        const worker = await module.exports.getWorkerById(i);
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
module.exports.getDatasetAddressByJob = async (job) => {
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
module.exports.getIpfsAddressByDatasetAddress = async (address) => {
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
module.exports.getDataDimByDatasetAddress = async (address) => {
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
module.exports.getCurrentPriceByDatasetAddress = async (address) => {
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
module.exports.getSamplesCountByDatasetAddress = async (address) => {
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
module.exports.getBatchesCountByDatasetAddress = async (address) => {
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
module.exports.getDatasets = async () => {    
    const jobs = await module.exports.getJobs();

    const datasets = await Promise.all(jobs.map(async (jobAddress, index) => {
        const datasetAddress = await module.exports.getDatasetAddressByJob(jobAddress);
        const ipfsAddress = await module.exports.getIpfsAddressByDatasetAddress(datasetAddress);
        const dataDim = await module.exports.getDataDimByDatasetAddress(datasetAddress);
        const currentPrice = await module.exports.getCurrentPriceByDatasetAddress(datasetAddress);
        const samplesCount = await module.exports.getSamplesCountByDatasetAddress(datasetAddress);
        const batchesCount = await module.exports.getBatchesCountByDatasetAddress(datasetAddress);
        
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
module.exports.getKernelAddressByJob = async (job) => {
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
module.exports.getIpfsAddressByKernelAddress = async (address) => {
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
module.exports.getDataDimByKernelAddress = async (address) => {
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
module.exports.getCurrentPriceByKernelAddress = async (address) => {
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
module.exports.getComplexityByKernelAddress = async (address) => {
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
module.exports.getKernels = async () => {

    const jobs = await module.exports.getJobs();

    const kernels = await Promise.all(jobs.map(async (jobAddress, index) => {
        const kernelAddress = await module.exports.exportsgetKernelAddressByJob(jobAddress);
        const ipfsAddress = await module.exports.exportsgetIpfsAddressByKernelAddress(kernelAddress);
        const dataDim = await module.exports.exportsgetDataDimByKernelAddress(kernelAddress);
        const currentPrice = await module.exports.exportsgetCurrentPriceByKernelAddress(kernelAddress);
        const complexity = await module.exports.exportsgetComplexityByKernelAddress(kernelAddress);

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

