'use strict';
const Jobs = require('../models/jobs');
const {
    addRecordsFactory,
    removeRecordByAddressFactory,
    getAllFactory
} = require('./utils/factories');
const pandora = require('../../pandora');

/**
 * Add (or update) jobs records
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.add = addRecordsFactory(Jobs, {
    baselineFlag: 'jobsBaseline', 
    subscribeEvent: 'subscribeJobs',
    formatRecord: record => {

        if (record.jobStatus === 7) {

            pandora.emit('unsubscribeJobAddress', {
                address: record.address
            });
        }

        return {
            address: record.address, 
            activeWorkersCount: record.activeWorkersCount, 
            batches: record.batches, 
            dataset: record.dataset, 
            description: record.description, 
            ipfsResults: record.ipfsResults.join(';'), 
            jobStatus: record.jobStatus, 
            jobType: record.jobType, 
            kernel: record.kernel, 
            progress: record.progress
        };
    }
});

/**
 * Remove dataset(s) from database 
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.remove = removeRecordByAddressFactory(Jobs);

/**
 * Get all jobs that fits to options
 *
 * @param {Object} options Query options
 * @returns {Promise}
 */
module.exports.getAll = getAllFactory(Jobs);
