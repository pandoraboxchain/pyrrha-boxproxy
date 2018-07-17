'use strict';
const { getAll } = require('../../db/api/kernels');

// @route /kernels
module.exports.getKernels = async (req, res, next) => {

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

// @route /kernels/:address
module.exports.getKernelByAddress = async (req, res, next) => {

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
