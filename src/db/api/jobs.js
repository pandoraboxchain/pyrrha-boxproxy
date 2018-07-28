'use strict';
const { Op } = require('sequelize');
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
    formatRecord: record => ({
        address: record.address, 
        activeWorkers: record.activeWorkers.join(';'), 
        dataset: record.dataset, 
        kernel: record.kernel,
        kernelIpfs: record.kernelIpfs,
        datasetIpfs: record.datasetIpfs,
        description: record.description, 
        ipfsResults: record.ipfsResults.join(';'), 
        state: record.state, 
        jobType: record.jobType, 
        progress: record.progress
    })
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
