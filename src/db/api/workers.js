'use strict';
const Workers = require('../models/workers');
const {
    addRecordsFactory,
    removeRecordByAddressFactory,
    getAllFactory
} = require('./utils/factories');

/**
 * Add (or update) workers records
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.add = addRecordsFactory(Workers, {
    baselineFlag: 'workersBaseline', 
    subscribeEvent: 'subscribeWorkers',
    formatRecord: record => ({
        address: record.address, 
        currentJob: record.currentJob, 
        currentJobStatus: record.currentJobStatus, 
        currentState: record.currentState
    })
});

/**
 * Remove dataset(s) from database 
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.remove = removeRecordByAddressFactory(Workers);

/**
 * Get all workers that fits to options
 *
 * @param {Object} options Query options
 * @returns {Promise}
 */
module.exports.getAll = getAllFactory(Workers);
