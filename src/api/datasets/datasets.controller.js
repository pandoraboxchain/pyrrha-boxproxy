'use strict';
const store = require('../../store');
const { cog: cogAbi } = store.get('abis');
const {
    getDatasets
} = require('../../libs/pandora.lib');

// @route /datasets
module.exports.getDatasets = async (req, res, next) => {

    try {

        const { datasets, errors } = await getDatasets();

        res.status(200).json({
            datasets: datasets.datasets,
            errors,
            datasetsTotal: datasets.datasets.length
        });
    } catch (err) {
        next(err);
    }
};
