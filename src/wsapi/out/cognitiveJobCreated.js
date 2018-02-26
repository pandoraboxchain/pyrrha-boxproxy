'use strict';
const store = require('../../store');
const {
    getJobByJobAddress,
    getIpfsAddressByKernelAddress,
    getDatasetByDatasetAddress
} = require('../../libs/pandora.lib');

const getJobStore = async (address, type) => {
    const job = await getJobByJobAddress(res.args.cognitiveJob);
    const kernel = await getIpfsAddressByKernelAddress(job.kernel);
    const dataset = await getDatasetByDatasetAddress(job.dataset)
    
    return {
        jobs: [
            {
                type: type,
                ...job
            }
        ],
        kernels: [kernel],
        dataset: [dataset]
    };
};

module.exports = push => {
    const web3 = store.get('web3');
    const { pan, mar } = store.get('contracts');
    const { 
        wor: worAbi, 
        cog: cogAbi,
        dat: datAbi,
        ker: kerAbi
    } = store.get('abis');

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
