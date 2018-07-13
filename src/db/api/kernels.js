'use strict';
const { Op } = require('sequelize');
const Kernels = require('../models/kernels');
const System = require('../models/system');
const { bulkInsertOrUpdate } = require('./utils/helpers');

/**
 * Check the flag is baseline has been saved
 *
 * @returns {Promise} {Boolean}
 */
module.exports.isBaseline = async () => {

    const kernelsBaseline = await System.findOne({
        where: {
            name: {
                [Op.eq]: 'kernelsBaseline'
            }
        }
    });

    return !!(kernelsBaseline && kernelsBaseline.value === 'yes');
};

/**
 * Save flag about baseline has been saved
 *
 * @returns {Promise}
 */
module.exports.fixBaseline = async () => {
    return await System.upsert({
        name: 'kernelsBaseline',
        value: 'yes'
    });
};

module.exports.clearBaseline = async () => {
    return await System.upsert({
        name: 'kernelsBaseline',
        value: 'no'
    });
};

/**
 * Add (or update) kernels records
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 */
module.exports.add = async (data = {}, options = {}) => {
    
    const kernelsRecords = data.records.map(record => ({
        index: record.id,
        address: record.address,
        ipfsAddress: record.ipfsAddress,
        dataDim: record.dataDim,
        currentPrice: record.currentPrice,
        complexity: record.complexity,
        metadata: record.metadata,
        description: record.description
    }));

    if (data.baseline) {

        await Kernels.destroy({
            where: {},
            truncate: true
        });

        // Save baseline records
        await Kernels.bulkCreate(kernelsRecords);

        // Save system flag what kernels baseline has been saved
        await module.exports.fixBaseline();

        if (!options.source) {

            throw new Error('Source object (event emitter) is required but not been provided by task');
        }

        options.source.emit('subscribeKernels', { 
            blockNumber: data.blockNumber 
        });
    } else {

        await bulkInsertOrUpdate(Kernels, ['address'], kernelsRecords);
    }
};

/**
 * Remove kernel(s) from database 
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 * @returns {Promise}
 */
module.exports.remove = async (data = {}, options = {}) => {
    // Extract addresses from records
    const removedAddresses = data.records.map(record => record.address);

    return await Kernels.destroy({
        where: {
            address: {
                [Op.or]: removedAddresses
            }
        }
    });
};
