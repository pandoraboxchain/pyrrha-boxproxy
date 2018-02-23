'use strict';
const store = require('../../store');
const web3 = store.get('web3');
const { pan } = store.get('contracts');
const { wor: worAbi } = store.get('abis');
const {    
    getJobAddressByWorkerId,
    getJobStateByJobAddress
} = require('../jobs/jobs.service');

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
