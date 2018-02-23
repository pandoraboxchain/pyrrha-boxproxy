'use strict';
const store = require('../../store');
const web3 = store.get('web3');
const { pan } = store.get('contracts');
const { wor: worAbi, cog: cogAbi } = store.get('abis');
const {
    getWorkerNodesCount
} = require('../workers/workers.service');

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

    const count = await getWorkerNodesCount();
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
