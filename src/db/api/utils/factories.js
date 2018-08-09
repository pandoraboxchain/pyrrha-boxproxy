'use strict';
const log = require('../../../logger');
const { Op, Model } = require('sequelize');
const system = require('../system');
const { 
    bulkInsertOrUpdate,
    extractFilerQuery,
    extractOrderQuery,
    extractPaginationQuery
 } = require('./helpers');

/**
 * Create a getAll getter for the model
 *
 * @param {Object} model
 * @returns {Function}
 */
module.exports.getAllFactory = model => {

    if (!model || typeof model.findAndCountAll !== 'function') {
    
        throw new Error('"model" option should be a Sequelize model instance');
    }

    /**
     * getAll method
     * 
     * @param {Object} options Query options
     */
    return async (options = {}) => {

        const filterQuery = extractFilerQuery(options);
        const orderQuery = extractOrderQuery(options);
        const paginationQuery = extractPaginationQuery(options);

        log.debug(`PandoraDbAPI:FIND, model "${model.name}" with query`, {
            where: filterQuery,
            order: orderQuery,
            ...paginationQuery
        });
        
        return await model.findAndCountAll({
            where: filterQuery,
            order: orderQuery,
            ...paginationQuery
        });
    };
};

/**
 * Create a removeByAddress method for the model
 *
 * @param {Object} model
 * @returns {Function}
 */
module.exports.removeRecordByAddressFactory = model => {

    if (!model || typeof model.destroy !== 'function') {
    
        throw new Error('"model" option should be a Sequelize model instance');
    }

    /**
     * removeByAddress method
     * 
     * @param {Object} data { records: Array[Object], baseline: Boolean }
     * @param {Object} options Options provided by task
     */
    return async (data = {}, options = {}) => {
        // Extract addresses from records
        const removedAddresses = data.records.map(record => record.address);

        log.debug(`PandoraDbAPI:REMOVE, model "${model.name}" by addresses`, removedAddresses);
    
        return await model.destroy({
            where: {
                address: {
                    [Op.or]: removedAddresses
                }
            }
        });
    };
};

/**
 * Create addRecord method for the model
 *
 * @param {Object} model
 * @param {Object} factoryOptions { baselineFlag: {String}, subscribeEvent: {String}, formatRecord: {Function} }
 * @returns {Function}
 */
module.exports.addRecordsFactory = (model, factoryOptions) => {

    if (!model || 
        typeof model.destroy !== 'function' ||
        typeof model.bulkCreate !== 'function') {
    
        throw new Error('"model" option should be a Sequelize model instance');
    }

    /**
     * addRecord method
     * 
     * @param {Object} data { records: Array[Object], baseline: Boolean }
     * @param {Object} options Options provided by task
     */
    return async (data = {}, options = {}) => {
        log.debug(`PandoraDbAPI:ADD, model "${model.name}"`, data);
    
        const records = data.records.map(record => factoryOptions.formatRecord(record));

        // We need this block number for restoring subscriptions 
        // so we should listen for events from next block not the current
        const nextBlockNumber = data.blockNumber + 1;
        log.debug(`PandoraDbAPI:ADD, going to save next block number "${nextBlockNumber}"`);

        // Save blockNumber for current data entity
        await system.saveBlockNumber({ 
            name: model.name,
            blockNumber: nextBlockNumber
        });
        
        log.debug(`PandoraDbAPI:ADD, current baseline mode for model "${model.name}": ${data.baseline}`);

        if (data.baseline) {
    
            await model.destroy({
                where: {},
                truncate: true
            });
    
            // Save baseline records
            await model.bulkCreate(records);
    
            // Save system flag what kernels baseline has been saved
            await system.fixBaseline(factoryOptions.baselineFlag);

            if (!options.source) {
    
                throw new Error('Source object (event emitter) is required but not been provided by task');
            }

            if (factoryOptions.subscribeEvent) {

                factoryOptions.subscribeEvent = Array.isArray(factoryOptions.subscribeEvent) ? factoryOptions.subscribeEvent : [factoryOptions.subscribeEvent];

                factoryOptions.subscribeEvent.forEach(eventName => {

                    log.debug(`PandoraDbAPI:ADD going to emit "${eventName}" event for model "${model.name}" with options`, { 
                        blockNumber: nextBlockNumber 
                    });
            
                    options.source.emit(eventName, { 
                        blockNumber: nextBlockNumber 
                    });
                });
            }            
        } else {

            log.debug(`PandoraDbAPI:ADD going to "bulkInsertOrUpdate" for model "${model.name}" with records`, records);
            await bulkInsertOrUpdate(model, ['address'], records);
        }

        if (factoryOptions.subscribeUpdateEvent) {

            const recordsForWatching = await model.findAll(factoryOptions.subscribeUpdateFilter || {});
            log.debug(`PandoraDbAPI:ADD going to emit "${factoryOptions.subscribeUpdateEvent}" event for model "${model.name}" records`, recordsForWatching);

            recordsForWatching.forEach(record => options.source.emit(factoryOptions.subscribeUpdateEvent, {
                address: record.address,
                blockNumber: nextBlockNumber 
            }));
        }
    };
};
