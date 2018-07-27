'use strict';
const { Op } = require('sequelize');
const System = require('../models/system');
const expect = require('../../utils/expect');

/**
 * Fetch all system records
 *
 * @returns {Promise<[{Object}]>} 
 */
module.exports.getAll = async () => {
    return await System.findAll();
};

/**
 * Check is system has benn already seeded
 *
 * @returns {Promise<{Boolean}>} 
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
 * @returns {Promise} upsert result
 */
module.exports.saveBlockNumber = async (data = {}, options = {}) => {

    expect.all(data, {
        'name': {
            type: 'string'
        },
        'blockNumber': {
            type: 'number'
        }
    });

    return await System.upsert({
        name: `${data.name}.blockNumber`,
        value: data.blockNumber
    });
}

/**
 * Fetch last saved block number
 * 
 * @param {String} name Model name
 * @returns {Promise<{Number}>} 
 */
module.exports.getBlockNumber = async (name) => {

    expect.all({ name }, {
        'name': {
            type: 'string'
        }
    });

    const blockNumber = await System.findOne({
        where: {
            name: {
                [Op.eq]: `${name}.blockNumber`
            }
        }
    });

    return blockNumber ? parseInt(blockNumber.value, 10) : 0;
};

/**
 * Check the flag is baseline has been saved
 * 
 * @param {String} flag
 * @returns {Promise<{Boolean}>}
 */
module.exports.isBaseline = async (flag) => {

    expect.all({ flag }, {
        'flag': {
            type: 'enum',
            values: [
                'kernelsBaseline',
                'datasetsBaseline',
                'workersBaseline',
                'jobsBaseline'
            ]
        }
    });

    const kernelsBaseline = await System.findOne({
        where: {
            name: {
                [Op.eq]: flag
            }
        }
    });

    return !!(kernelsBaseline && kernelsBaseline.value === 'yes');
};

/**
 * Get saved contracts addresses from database
 * 
 * @returns {Promise<Object>} {Pandora: {String}, PandoraMarket: {String}}
 */
module.exports.getContactsAddresses = async () => {

    const [ pandoraRecord, marketRecord ] = await Promise.all([
        'contract.Pandora', 
        'contract.PandoraMarket'
    ].map(key => System.findOne({
        where: {
            name: {
                [Op.eq]: key
            }
        }
    })));

    return {
        Pandora: pandoraRecord ? pandoraRecord.value : null,
        PandoraMarket: marketRecord ? marketRecord.value : null
    }
};

/**
 * Save flag about baseline has been saved
 * 
 * @param {String} flag
 * @returns {Promise} upsert result
 */
module.exports.fixBaseline = async (flag) => {

    expect.all({ flag }, {
        'flag': {
            type: 'enum',
            values: [
                'kernelsBaseline',
                'datasetsBaseline',
                'workersBaseline',
                'jobsBaseline'
            ]
        }
    });

    return await System.upsert({
        name: flag,
        value: 'yes'
    });
};

/**
 * Clear flag about baseline has been saved
 * 
 * @param {String} flag
 * @returns {Promise} upsert result
 */
module.exports.clearBaseline = async (flag) => {

    expect.all({ flag }, {
        'flag': {
            type: 'enum',
            values: [
                'kernelsBaseline',
                'datasetsBaseline',
                'workersBaseline',
                'jobsBaseline'
            ]
        }
    });
    
    return await System.upsert({
        name: flag,
        value: 'no'
    });
};
