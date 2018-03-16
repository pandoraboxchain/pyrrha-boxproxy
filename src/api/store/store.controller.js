'use strict';
const store = require('../../store');
const { 
    workers: {
        fetchAll: fetchAllWorkers
    },
    jobs: {
        fetchAll: fetchAllJobs
    },
    kernels: {
        fetchAll: fetchAllKernels
    },
    datasets: {
        fetchAll: fetchAllDatasets
    }  
} = store.get('pjs');

// @route /store
module.exports.getStore = async (req, res ,next) => {

    try {

        const workers = await fetchAllWorkers();
        const jobs = await fetchAllJobs();
        const kernels = await fetchAllKernels();
        const datasets = await fetchAllDatasets();

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
