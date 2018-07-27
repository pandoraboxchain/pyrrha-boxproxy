'use strict';
const { normalizePageLimit } = require('../../utils/pagination');
const { getAll } = require('../../db/api/workers');

// @route /workers/count
module.exports.getWorkerNodesCount = async (req, res, next) => {

    try {

        const { count } = await getAll(req.query);        
        
        res.status(200).json({
            count
        });
    } catch(err) {
        next(err);
    }
};

// @route /workers
module.exports.getWorkers = async (req, res, next) => {

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

// @route /workers/:id
module.exports.getWorkerById = async (req, res, next) => {

    try {

        const { rows, count } = await getAll({
            filterBy: `index:eq:${req.params.id}:number`
        });
        
        res.status(200).json({
            records: rows,
            count
        });
    } catch(err) {
        next(err);
    }
};

// @route /workers:address
module.exports.getWorkerByAddress = async (req, res, next) => {

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
