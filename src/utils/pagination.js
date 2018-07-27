'use strict';
const config = require('../../config');

/**
 * Normalizing limit and page value 
 * in relation to actual records count value
 *
 * @param {Number} page
 * @param {Number} limit
 * @param {Number} count
 * @return {Object}
 */
module.exports.normalizePageLimit = (page, limit, count) => {
    limit = Number(limit || config.database.pagination.limit);
    page = Number(count <= limit ? 1 : (page || 1));

    return {
        limit,
        page
    };        
};
