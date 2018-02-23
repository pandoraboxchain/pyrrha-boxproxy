'use strict';
const store = require('../../store');
const { cog: cogAbi } = store.get('abis');
const {
    getDatasets
} = require('./datasets.service');

// @route /datasets
module.exports.getDatasets = async (req, res, next) => {

    try {

        const datasets = await getDatasets();

        res.status(200).json({
            datasets,
            datasetsTotal: datasets.length
        });
    } catch (err) {
        next(err);
    }
};
