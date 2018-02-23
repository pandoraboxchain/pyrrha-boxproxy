'use strict';
const { getWorkers } = require('../workers/workers.service');
const { getJobs } = require('../jobs/jobs.service');
const { getKernels } = require('../kernels/kernels.service');
const { getDatasets } = require('../datasets/datasets.service');

// @route /store
module.exports.getStore = async (req, res ,next) => {

    try {

        const workers = await getWorkers();
        const jobs = await getJobs();
        const kernels = await getKernels();
        const datasets = await getDatasets();

        res.status(200).json({
            workers,
            jobs,
            kernels,
            datasets
        });
    } catch(err) {
        next(err);
    }
};
