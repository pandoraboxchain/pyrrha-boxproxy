'use strict';
const store = require('../../store');
const { datasets: { fetchAll, fetchDataset } } = store.get('pjs');

// @route /datasets
module.exports.getDatasets = async (req, res, next) => {

    try {

        const { records, error } = await fetchAll();

        res.status(200).json({
            datasets: records,
            error,
            datasetsTotal: records.length
        });
    } catch (err) {
        next(err);
    }
};

// @route /datasets:address
module.exports.getDatasetByAddress = async (req, res, next) => {

    try {

        const dataset = await fetchDataset(req.params.address);
        
        res.status(200).json(dataset);
    } catch(err) {
        next(err);
    }
};
