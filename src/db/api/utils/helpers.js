'use strict';
const { Op } = require('sequelize');

/**
 * Bulk insertion helper for sequelize
 * (inserts new record or doing update existed by the condition)
 *
 * @param {Object} model Sequelize model
 * @param {Array[String]} condition Array of key to find by
 * @param {Array[Object]} values Array of objects to insert
 * @returns {Promise}
 */
module.exports.bulkInsertOrUpdate = async (model, condition = [], values = []) => {
    
    if (typeof model !== 'object' || typeof model.findOne !== 'function') {

        throw new Error('"model" option should be a Sequalize model instance');
    }
    
    return await Promise.all(values.map(record => async () => {
        let existenRecord;
        
        if (Array.isArray(condition) && condition.length > 0) {

            const parsedCondition = {};

            condition.forEach(key => {
                parsedCondition[key] = {
                    [Op.eq]: record[key]
                };
            });

            existenRecord = await model.findOne({
                where: parsedCondition
            });
        }

        if (existenRecord) {

            await existenRecord.update(record);
        } else {

            await model.create(record);
        }
    }));
};
