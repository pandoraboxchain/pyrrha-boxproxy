'use strict';
const {
    getWorkers,
    getJobs,
    getKernels,
    getDatasets
} = require('../../libs/pandora.lib');

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
