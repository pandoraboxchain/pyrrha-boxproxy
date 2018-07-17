'use strict';
const Datasets = require('../models/datasets');
const {
    addRecordsFactory,
    removeRecordByAddressFactory,
    getAllFactory
} = require('./utils/factories');

/**
 * Add (or update) datasets records
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 */
module.exports.add = addRecordsFactory(Datasets, {
    baselineFlag: 'datasetsBaseline', 
    subscribeEvent: 'subscribeDatasets',
    formatRecord: record => ({
        index: record.id,
        address: record.address,
        ipfsAddress: record.ipfsAddress,
        dataDim: record.dataDim,
        currentPrice: record.currentPrice,
        metadata: record.metadata,
        description: record.description
    })
});

/**
 * Remove dataset(s) from database 
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.remove = removeRecordByAddressFactory(Datasets);

/**
 * Get all datasets that fits to options
 *
 * @param {Object} options Query options
 * @returns {Promise}
 */
module.exports.getAll = getAllFactory(Datasets);
