'use strict';
const {
    getWorkerNodesCount,
    getWorkers,
    getWorkerById
} = require('../../libs/pandora.lib');

// @route /workers/count
module.exports.getWorkerNodesCount = async (req, res, next) => {

    try {

        const count = await getWorkerNodesCount();
        res.status(200).json({ count });
    } catch(err) {
        next(err);
    }
};

// @route /workers
module.exports.getWorkers = async (req, res, next) => {

    try {

        const workers = await getWorkers();

        res.status(200).json({
            workers,
            workersTotal: workers.length
        });
    } catch (err) {
        next(err);
    }
};

// @route /workers/:id
module.exports.getWorkerById = async (req, res, next) => {

    try {

        const worker = await getWorkerById(req.params.id);        

        res.status(200).json(worker);
    } catch (err) {
        next(err);
    }
};
