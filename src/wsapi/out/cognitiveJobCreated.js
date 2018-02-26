'use strict';
const store = require('../../store');
const {
    getJobByJobAddress,
    getIpfsAddressByKernelAddress,
    getDatasetByDatasetAddress
} = require('../../libs/pandora.lib');

/**
 * Get created/changed job store
 * 
 * @param {string} address 
 * @param {string} type 'created'|'changed'
 * @returns {Object}
 */
const getJobStore = async (address, type) => {
    const job = await getJobByJobAddress(res.args.cognitiveJob);
    const kernel = await getIpfsAddressByKernelAddress(job.kernel);
    const dataset = await getDatasetByDatasetAddress(job.dataset)
    
    return {
        jobs: [
            {
                type,
                ...job
            }
        ],
        kernels: [kernel],
        dataset: [dataset]
    };
};

module.exports = push => {
    const web3 = store.get('web3');
    const { pan } = store.get('contracts');
    const { cog: cogAbi } = store.get('abis');

    pan.events.CognitiveJobCreated({
        fromBlock: 0
    })
    .on('data', async (res) => {

        const jobStore= await getJobStore(res.args.cognitiveJob, 'created');
        push(jobStore);

        const cog = new web3.eth.Contract(cogAbi, job.address);
        cog.events.StateChanged({
            fromBlock: 0
        })
        .on('data', async res => {
            const jobStore = await getJobStore(res.address, 'changed');
            push(jobStore);
        })
        .on('error', err => push({
            error: err,
            event: 'StateChanged'
        }));
    })
    .on('error', err => push({
        error: err,
        event: 'CognitiveJobCreated'
    }));
};