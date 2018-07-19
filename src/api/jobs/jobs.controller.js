'use strict';
const { getAll } = require('../../db/api/jobs');

// @route /jobs
module.exports.getJobs = async (req, res, next) => {

    try {

        const { rows, count } = await getAll(req.query);
        
        res.status(200).json({
            records: rows,
            count,
            limit: req.query.limit || 5,
            page: req.query.page || 1
        });
    } catch(err) {
        next(err);
    }
};

// @route /jobs/:address
module.exports.getJobByAddress = async (req, res, next) => {

    try {

        const { rows, count } = await getAll({
            filterBy: `address:eq:${req.params.address}`
        });
        
        res.status(200).json({
            records: rows,
            count
        });
    } catch(err) {
        next(err);
    }
};
