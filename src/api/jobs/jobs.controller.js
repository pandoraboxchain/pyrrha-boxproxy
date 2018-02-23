'use strict';
const {
    getJobs
} = require('./jobs.service');

// @route /jobs
module.exports.getJobs = async (req, res, next) => {

    try {

        const jobs = await getJobs();
        
        res.status(200).json({
            jobs,
            jobsTotal: jobs.length
        });
    } catch(err) {
        next(err);
    }
};
