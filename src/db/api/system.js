'use strict';
const { Op } = require('sequelize');
const System = require('../models/system');

/**
 * Fetch all system records
 *
 * @returns {Promise} {Array[{Object}]}
 */
module.exports.getAll = async () => {
    return await System.findAll();
};

/**
 * Check is system has benn already seeded
 *
 * @returns {Promise} {Boolean}
 */
module.exports.isAlreadySeeded = async () => {
    const alreadySeeded = await System.findOne({
        where: {
            name: {
                [Op.eq]: 'alreadySeeded'
            },
            value: {
                [Op.eq]: 'yes'
            }
        }
    });

    return !!alreadySeeded;
};

/**
 * Save block number
 *
 * @param {Object} data { records: Array[Object], baseline: Boolean }
 * @param {Object} options Options provided by task
 */
module.exports.saveBlockNumber = async (data = {}, options = {}) => {
    return await System.upsert({
        name: 'blockNumber',
        value: data.blockNumber
    });
}

/**
 * Fetch last saved block number
 *
 * @returns {Promise} {Number}
 */
module.exports.getBlockNumber = async () => {
    const blockNumber = await System.findOne({
        where: {
            name: {
                [Op.eq]: 'blockNumber'
            }
        }
    });

    return blockNumber ? parseInt(blockNumber.value, 10) : 0;
};
