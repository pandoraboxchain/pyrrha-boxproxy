'use strict';
const { Op } = require('sequelize');
const config = require('../../../../config');

/**
 * Bulk insertion helper for sequelize
 * (inserts new record or doing update existed by the condition)
 *
 * @param {Object} model Sequelize model
 * @param {Array[String]} condition Array of key to find by
 * @param {Array[Object]} values Array of objects to insert
 * @returns {Promise}
 */
module.exports.bulkInsertOrUpdate = (model, condition = [], values = []) => {

    if (typeof model.findOne !== 'function') {

        throw new Error('"model" option should be a Sequelize model instance');
    }

    return Promise.all(values.map(async (record) => {
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

/**
 * Extract pagination params from options
 *
 * @param {Object} options Query options
 * @returns {Object}
 */
module.exports.extractPaginationQuery = (options = {}) => {
    const pagination = {};

    pagination.limit = parseInt(options.limit, 10) || config.database.pagination.limit || 5;
    pagination.offset = options.page && options.page > 0 ? (options.page - 1) * pagination.limit : 0;

    return pagination;
};

/**
 * Extract ordering query from options
 *
 * @param {Object} options Query options
 * @returns {Array}
 */
module.exports.extractOrderQuery = (options = {}) => {
    let order = [];

    // options.orderBy is something like: "title:asc;price:desc"
    if (options.orderBy) {

        order = options.orderBy.split(';').map(rule => {
            const parsedRule = rule.split(':');
            return [parsedRule[0], (parsedRule[1] && parsedRule[1].toLowerCase() === 'desc' ? 'DESC' : 'ASC')];
        });
    }

    return order;
};

/**
 * Extract filtering query from options
 *
 * @param {Object} options Query options
 * @returns {Object}
 */
module.exports.extractFilerQuery = (options = {}) => {
    const filterQuery = {};

    // options.filterBy is something like: "title:like:hello;price:gte:10"
    // filtering operators are sequelizejs query operators
    // can be used following: 
    // gt, gte, lt, lte, ne, eq, not, like, notLike
    if (options.filterBy) {

        options.filterBy.split(';').forEach(filter => {

            if (!filter || filter === '') {
                
                return;
            }

            const parsedFilter = filter.split(':');
            let key = String(parsedFilter[0]);
            let operator;
            let value;
            
            switch (parsedFilter[1]) {
                case 'gt':
                    operator = Op.gt;
                    value = Number(parsedFilter[2]);
                    break;
                
                case 'gte':
                    operator = Op.gte;
                    value = Number(parsedFilter[2]);
                    break; 

                case 'lt':
                    operator = Op.lt;
                    value = Number(parsedFilter[2]);
                    break;

                case 'lte':
                    operator = Op.lte;
                    value = Number(parsedFilter[2]);
                    break;

                case 'ne':
                    operator = Op.ne;
                    value = parsedFilter[3] === 'number' ? Number(parsedFilter[2]) : parsedFilter[2];
                    break;

                case 'eq':
                    operator = Op.eq;
                    value = parsedFilter[3] === 'number' ? Number(parsedFilter[2]) : parsedFilter[2];
                    break;                    

                case 'not':
                    operator = Op.not;
                    value = typeof parsedFilter[2] === 'boolean' ? parsedFilter[2] : (parsedFilter[2] === 'true');
                    break;

                case 'like':
                    operator = Op.like;
                    value = `%${String(parsedFilter[2])}%`;
                    break;

                case 'notLike':
                    operator = Op.notLike;
                    value = `%${String(parsedFilter[2])}%`;
                    break;

                case 'in':
                    operator = Op.in;
                    value = parsedFilter[2].split(',').map(val => parsedFilter[3] === 'number' ? Number(val) : val);
                    break;

                case 'notIn':
                    operator = Op.notIn;
                    value = parsedFilter[2].split(',').map(val => parsedFilter[3] === 'number' ? Number(val) : val);
                    break;

                default:
            }

            if (operator) {

                if (typeof filterQuery[key] !== 'object') {

                    filterQuery[key] = {};
                }

                filterQuery[key][operator] = value;
            }
        });
    }

    return filterQuery;
};
