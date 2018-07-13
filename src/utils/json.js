/**
 * JSON format related utils
 * 
 * @file json.js
 * @author Kostiantyn Smyrnov <kostysh@gmail.com>
 * @date 2018
 */

'use strict';

/**
 * Stringify objects with circular refs
 *
 * @param {Object} obj
 * @return {String}
 */
module.exports.stringifyCircular = obj => {
    let cache = [];
    
    return JSON.stringify(obj, (key, value) => {

        if (value instanceof Error) {

            const obj = {};
            Object.getOwnPropertyNames(value).forEach(key => {
                obj[key] = value[key];
            });

            return obj;
        }

        if (typeof value === 'object' && value !== null) {
            
            if (cache.indexOf(value) >= 0) {

                return;
            }
            
            cache.push(value);
        }

        return value;
    });
};

/**
 * Cleanup object from circular structures
 *
 * @param {Objecy} obj
 * @return {Object}
 */
module.exports.safeObject = obj => JSON.parse(module.exports.stringifyCircular(obj));
