'use strict';
const store = require('../store');
const web3 = store.get('web3');
const { pan, mar } = store.get('contracts');
const { 
    wor: worAbi, 
    cog: cogAbi,
    dat: datAbi,
    ker: kerAbi
} = store.get('abis');

///////////////////////////////////////
//
// Workers related methods
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
    return Number.parseInt(count);
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
    return String(address);
};

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
    return Number.parseInt(state);
};

/**
 * Get worker reputation from Worker contract by the worker address
 * 
 * @param {string} address 
 * @returns {integer}
 */
const getWorkerReputationByWorkerAddress = async (address) => {
    const wor = new web3.eth.Contract(worAbi, address);
    const reputation = await wor.methods
        .reputation()
        .call();
    return Number.parseInt(reputation);
};

/**
 * Get worker's active job from Worker contract by the worker address
 * 
 * @param {string} address 
 * @returns {string}
 */
const getActiveJobAddressByWorkerAddress = async (address) => {
    const wor = new web3.eth.Contract(worAbi, address);
    const activeJob = await wor.methods
        .activeJob()
        .call();
    return String(activeJob);
};

/**
 * Get worker by the worker's id
 * 
 * @param {integer} id 
 * @returns {Object}
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
    const reputation = await getWorkerReputationByWorkerAddress(workerAddress);

    let activeJob = await getActiveJobAddressByWorkerAddress(workerAddress);
    let jobState;

    // Check is not 0x0
    if (+activeJob !== 0) {

        jobState = await getJobStateByJobAddress(jobAddress);
    } else {
        activeJob = null;
        jobState = -1;
    }

    return {
        id: id,
        address: workerAddress,
        currentState: workerState,
        reputation: reputation,
        currentJob: activeJob,
        currentJobStatus: jobState
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
// Jobs related methods
//
///////////////////////////////////////

/**
 * Get active job count from Pandora contract
 * 
 * @returns {integer} 
 */
const getActiveJobsCount = async () => {
    const count = await pan.methods
        .activeJobsCount()
        .call();
    return Number.parseInt(count);
};

/**
 * Get worker by the worker's id
 * 
 * @param {integer} id 
 * @returns {string}
 */
const getJobAddressById = async (id) => {
    const jobAddress = await pan.methods
        .activeJobs(id)
        .call();
    return String(jobAddress);
};

/**
 * Get job state from Cognitive Job contract by the job address
 * 
 * @param {string} address 
 * @returns {integer} 
 */
const getJobStateByJobAddress = async (address) => {
    const cog = new web3.eth.Contract(cogAbi, address);
    const state = await cog.methods
        .currentState()
        .call();
    return Number.parseInt(state);
};

/**
 * Get job kernel from Cognitive Job contract by the job address
 * 
 * @param {string} address 
 * @returns {string} 
 */
const getJobKernelByJobAddress = async (address) => {
    const cog = new web3.eth.Contract(cogAbi, address);
    const kernel = await cog.methods
        .kernel()
        .call();
    return String(kernel);
};

/**
 * Get job dataset from Cognitive Job contract by the job address
 * 
 * @param {string} address 
 * @returns {string} 
 */
const getJobDatasetByJobAddress = async (address) => {
    const cog = new web3.eth.Contract(cogAbi, address);
    const dataset = await cog.methods
        .dataset()
        .call();
    return String(dataset);
};

/**
 * Get job batches from Cognitive Job contract by the job address
 * 
 * @param {string} address 
 * @returns {integer} 
 */
const getJobBatchesByJobAddress = async (address) => {
    const cog = new web3.eth.Contract(cogAbi, address);
    const batches = await cog.methods
        .batches()
        .call();
    return Number.parseInt(batches);
};

/**
 * Get job progress from Cognitive Job contract by the job address
 * 
 * @param {string} address 
 * @returns {integer} 
 */
const getJobProgressByJobAddress = async (address) => {
    const cog = new web3.eth.Contract(cogAbi, address);
    const progress = await cog.methods
        .progress()
        .call();
    return Number.parseInt(progress);
};

/**
 * Get job's ipfsResults from Cognitive Job contract by the job address
 * 
 * @param {string} address 
 * @returns {string[]} 
 */
const getJobIpfsResultsByJobAddress = async (address) => {
    const cog = new web3.eth.Contract(cogAbi, address);
    const ipfsResults = await cog.methods
        .ipfsResults()
        .call();
    return ipfsResults;
};

/**
 * Get job by the job address
 * 
 * @param {string} address 
 * @returns {Object} 
 */
const getJobByJobAddress = async (address) => {
    const state = await getJobStateByJobAddress(address);
    const kernel = await getJobKernelByJobAddress(address);
    const dataset = await getJobDatasetByJobAddress(address);
    const batches = await getJobBatchesByJobAddress(address);
    const progress = await getJobProgressByJobAddress(address);
    const ipfsResults = await getJobIpfsResultsByJobAddress(address);
    
    return {
        address: address,
        jobStatus: state,
        kernel: kernel,
        dataset: dataset,
        batches: batches,
        progress: progress,
        ipfsResults: ipfsResults,
        activeWorkersCount: batches
    };
};

/**
 * Get all jobs
 * 
 * @returns {Object[]} 
 */
const getJobs = async () => {

    const count = await getActiveJobsCount();
    let jobs = [];

    for (let i=0; i < count; i++) {

        const address = await getJobAddressById(i);
        const job = await getJobByJobAddress(address);
        
        jobs.push({
            id: i,
            ...job
        });
    }

    return jobs;
};

///////////////////////////////////////
//
// Kernels related methods
//
///////////////////////////////////////

/**
 * Get Kernel address by kernel id
 * 
 * @param {integer} id
 * @returns {string}
 */
const getKernelAddressById = async (id) => {
    const kernelContract = await mar.methods
        .kernels(id)
        .call();
    return kernelContract;
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
    return String(ipfsAddress);
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
    return Number.parseInt(dataDim);
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
    return Number.parseInt(currentPrice);
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
    return Number.parseInt(complexity);
};

/**
 * Get Kernel by the kernel address
 * 
 * @param {string} address
 * @returns {Object}
 */
const getKernelByKernelAddress = async (address) => {
    const ipfsAddress = await getIpfsAddressByKernelAddress(address);
    const dataDim = await getDataDimByKernelAddress(address);
    const currentPrice = await getCurrentPriceByKernelAddress(address);
    const complexity = await getComplexityByKernelAddress(address);

    return {
        address: address,
        ipfs: ipfsAddress,
        dim: dataDim,
        price: currentPrice,
        complexity: complexity
    };
};

/**
 * Get all kernels
 * 
 * @returns {Object[]} 
 */
const getKernels = async () => {

    let id = 0;
    let kernels = [];

    while (true) {
        
        let kernel = '0x0';

        try {
            kernel = await getKernelAddressById(id++);// can be 0x0
        } catch(err) {
            // @todo Add method getKernelsCount to the PandoraMarket contract for avoid iterating with "try catch"
        }
        
        if (+kernel === 0) {
            break;
        }

        const kernelAddress = kernel;
        const kernelObj = await getKernelByKernelAddress(kernelAddress);

        kernels.push({
            id: id,
            ...kernelObj
        });
    }

    return kernels;
};

///////////////////////////////////////
//
// Datasets related methods
//
///////////////////////////////////////

/**
 * Get Dataset address by kernel id
 * 
 * @param {integer} id
 * @returns {string}
 */
const getDatasetAddressById = async (id) => {
    const datasetContract = await mar.methods
        .datasets(id)
        .call();
    return datasetContract;
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
    return String(ipfsAddress);
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
    return Number.parseInt(dataDim);
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
    return Number.parseInt(currentPrice);
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
    return Number.parseInt(samplesCount);
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
    return Number.parseInt(batchesCount);
};

/**
 * Get dataset by the dataset address
 * 
 * @param {string} address
 * @returns {Object}
 */
const getDatasetByDatasetAddress = async (address) => {
    const ipfsAddress = await getIpfsAddressByDatasetAddress(address);
    const dataDim = await getDataDimByDatasetAddress(address);
    const currentPrice = await getCurrentPriceByDatasetAddress(address);
    const samplesCount = await getSamplesCountByDatasetAddress(address);
    const batchesCount = await getBatchesCountByDatasetAddress(address);

    return {
        address: address,
        ipfsAddress: ipfsAddress,
        dataDim: dataDim,
        currentPrice: currentPrice,
        samplesCount: samplesCount,
        batchesCount: batchesCount
    };
};

/**
 * Get all datasets
 * 
 * @returns {Object[]}
 */
const getDatasets = async () => {

    let id = 0;
    let datasets = [];

    while (true) {
        
        let dataset = '0x0';

        try {
            dataset = await getDatasetAddressById(id++);// can be 0x0
        } catch(err) {
            // @todo Add method getDatasetsCount to the PandoraMarket contract for avoid iterating with "try catch"
        }
        
        if (+dataset === 0) {
            break;
        }

        const datasetAddress = dataset;
        const datasetObj = await getDatasetByDatasetAddress(datasetAddress);

        datasets.push({
            id: id,
            ...datasetObj
        });
    }

    return datasets;
};

///////////////////////////////////////
// 
// Exports
//
///////////////////////////////////////

// Workers
module.exports.getWorkerNodesCount = getWorkerNodesCount;
module.exports.getWorkerAddressById = getWorkerAddressById;
module.exports.getWorkerStateByWorkerAddress = getWorkerStateByWorkerAddress;
module.exports.getWorkerReputationByWorkerAddress = getWorkerReputationByWorkerAddress;
module.exports.getActiveJobAddressByWorkerAddress = getActiveJobAddressByWorkerAddress;
module.exports.getWorkerById = getWorkerById;
module.exports.getWorkers = getWorkers;

// Jobs
module.exports.getActiveJobsCount= getActiveJobsCount;
module.exports.getJobAddressById = getJobAddressById;
module.exports.getJobStateByJobAddress = getJobStateByJobAddress;
module.exports.getJobKernelByJobAddress = getJobKernelByJobAddress;
module.exports.getJobDatasetByJobAddress = getJobDatasetByJobAddress;
module.exports.getJobBatchesByJobAddress = getJobBatchesByJobAddress;
module.exports.getJobProgressByJobAddress = getJobProgressByJobAddress;
module.exports.getJobIpfsResultsByJobAddress = getJobIpfsResultsByJobAddress;
module.exports.getJobByJobAddress = getJobByJobAddress;
module.exports.getJobs = getJobs;

// Kernels
module.exports.getKernelByKernelAddress = getKernelByKernelAddress;
module.exports.getIpfsAddressByKernelAddress = getIpfsAddressByKernelAddress;
module.exports.getDataDimByKernelAddress = getDataDimByKernelAddress;
module.exports.getCurrentPriceByKernelAddress = getCurrentPriceByKernelAddress;
module.exports.getComplexityByKernelAddress = getComplexityByKernelAddress;
module.exports.getKernels = getKernels;

// Datasets
module.exports.getDatasetByDatasetAddress = getDatasetByDatasetAddress;
module.exports.getIpfsAddressByDatasetAddress = getIpfsAddressByDatasetAddress;
module.exports.getDataDimByDatasetAddress = getDataDimByDatasetAddress;
module.exports.getCurrentPriceByDatasetAddress = getCurrentPriceByDatasetAddress;
module.exports.getSamplesCountByDatasetAddress = getSamplesCountByDatasetAddress;
module.exports.getBatchesCountByDatasetAddress = getBatchesCountByDatasetAddress;
module.exports.getDatasets = getDatasets;
