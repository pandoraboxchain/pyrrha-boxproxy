'use strict';
const { getAll } = require('../../db/api/datasets');

// @route /datasets
module.exports.getDatasets = async (req, res, next) => {

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

// @route /datasets/:address
module.exports.getDatasetByAddress = async (req, res, next) => {

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
