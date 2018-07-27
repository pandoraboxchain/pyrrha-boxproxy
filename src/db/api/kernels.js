'use strict';
const Kernels = require('../models/kernels');
const {
    addRecordsFactory,
    removeRecordByAddressFactory,
    getAllFactory
} = require('./utils/factories');

/**
 * Add (or update) kernels records
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.add = addRecordsFactory(Kernels, {
    baselineFlag: 'kernelsBaseline', 
    subscribeEvent: 'subscribeKernels',
    formatRecord: record => ({
        address: record.address,
        ipfsAddress: record.ipfsAddress,
        dataDim: record.dataDim,
        currentPrice: record.currentPrice,
        complexity: record.complexity,
        metadata: record.metadata,
        description: record.description
    })
});

/**
 * Remove kernel(s) from database 
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.remove = removeRecordByAddressFactory(Kernels);

/**
 * Get all kernels that fits to options
 *
 * @param {Object} options Query options
 * @returns {Promise}
 */
module.exports.getAll = getAllFactory(Kernels);
