'use strict';
const { normalizePageLimit } = require('../../utils/pagination');
const { getAll } = require('../../db/api/kernels');

// @route /kernels
module.exports.getKernels = async (req, res, next) => {

    try {

        const { rows, count } = await getAll(req.query);
        const { limit, page } = normalizePageLimit(req.query.page, req.query.limit, count);
        
        res.status(200).json({
            records: rows,
            count,
            limit,
            page
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
