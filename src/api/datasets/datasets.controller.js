'use strict';
const store = require('../../store');
const { datasets: { fetchAll } } = store.get('pjs');

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
