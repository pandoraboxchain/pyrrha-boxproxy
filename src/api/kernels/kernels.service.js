'use strict';
const store = require('../../store');
const web3 = store.get('web3');
const { cog: cogAbi, ker: kerAbi } = store.get('abis');
const {
    getJobs
} = require('../jobs/jobs.service');

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

    const jobs = await getJobs();

    const kernels = await Promise.all(jobs.map(async (jobAddress, index) => {
        const kernelAddress = await module.exportsgetKernelAddressByJob(jobAddress);
        const ipfsAddress = await module.exportsgetIpfsAddressByKernelAddress(kernelAddress);
        const dataDim = await module.exportsgetDataDimByKernelAddress(kernelAddress);
        const currentPrice = await module.exportsgetCurrentPriceByKernelAddress(kernelAddress);
        const complexity = await module.exportsgetComplexityByKernelAddress(kernelAddress);

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
