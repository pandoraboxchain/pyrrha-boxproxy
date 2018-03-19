'use strict';
const store = require('../../store');
const { 
    workers: {
        fetchCount,
        fetchAll,
        fetchWorkerById,
        fetchWorker
    } 
} = store.get('pjs');

// @route /workers/count
module.exports.getWorkerNodesCount = async (req, res, next) => {

    try {

        const count = await fetchCount();
        res.status(200).json({ count });
    } catch(err) {
        next(err);
    }
};

// @route /workers
module.exports.getWorkers = async (req, res, next) => {

    try {

        const { records, error } = await fetchAll();

        res.status(200).json({
            workers: records,
            error,
            workersTotal: records.length
        });
    } catch (err) {
        next(err);
    }
};

// @route /workers/:id
module.exports.getWorkerById = async (req, res, next) => {

    try {

        const worker = await fetchWorkerById(req.params.id);        

        res.status(200).json(worker);
    } catch (err) {
        next(err);
    }
};

// @route /workers:address
module.exports.getWorkerByAddress = async (req, res, next) => {

    try {

        const worker = await fetchWorker(req.params.address);
        
        res.status(200).json(worker);
    } catch(err) {
        next(err);
    }
};
