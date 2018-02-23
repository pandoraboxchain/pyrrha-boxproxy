'use strict';
const store = require('../../store');
const web3 = store.get('web3');
const { cog: cogAbi, dat: datAbi } = store.get('abis');
const {
    getJobs
} = require('../jobs/jobs.service');

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
    const jobs = await getJobs();

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
