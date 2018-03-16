'use strict';
const store = require('../../store');
const { jobs: { fetchAll } } = store.get('pjs');

// @route /jobs
module.exports.getJobs = async (req, res, next) => {

    try {

        const { records, error } = await fetchAll();
        
        res.status(200).json({
            jobs: records,
            error,
            jobsTotal: records.length
        });
    } catch(err) {
        next(err);
    }
};
