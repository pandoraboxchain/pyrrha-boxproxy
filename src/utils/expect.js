/**
 * Ensuring expected parameters helper
 * 
 * @file expect.js
 * @author Kostiantyn Smyrnov <kostysh@gmail.com>
 * @date 2018
 */

'use strict';

const OPTIONS_REQUIRED = 'Options are required';
const MODEL_REQUIRED = 'Model is required';
const MODEL_TYPE_OPTIONS_REQUIRED = 'MODEL_TYPE_OPTIONS_REQUIRED';
const WRONG_TYPE = 'Wrong type of the property';
const ADDRESS_REQUIRED = 'Address required';

/**
 * ExpecrError class
 *
 * @class ExpectError
 * @extends {Error}
 */
class ExpectError extends Error {

    /**
     * Creates an instance of ExpectError.
     * @param {String} message
     * @memberof ExpectError
     */
    constructor(message = 'Unknown error', ...args) {
        super(message);
        this.args = args;
    }
}

/**
 * Ensuring expected parameters helper
 *
 * @param {Object} options
 * @param {Object} model
 */
module.exports.all = (options = {}, model = {}) => {

    if (typeof options !== 'object' || Object.keys(options).length === 0) {

        throw new ExpectError(OPTIONS_REQUIRED);
    }

    if (typeof model !== 'object' || Object.keys(model).length === 0) {

        throw new ExpectError(MODEL_REQUIRED);
    }

    for (let key of Object.keys(model)) {

        if (!model[key].type) {

            throw new ExpectError('Model property must have a "type" defined');
        }

        let value = key.split('.').reduce((acc, part) => {
            return acc && acc[part] !== undefined ? acc[part] : null;
        }, options);

        switch (model[key].type) {
            case 'enum':

                if (!model[key].values || !Array.isArray(model[key].values)) {

                    throw new ExpectError(MODEL_TYPE_OPTIONS_REQUIRED, {
                        expected: 'enum',
                        values: model[key].values,
                        key,
                        value
                    });
                }

                if (!model[key].values.includes(value)) {

                    throw new ExpectError(WRONG_TYPE, {
                        expected: 'enum',
                        values: model[key].values,
                        key,
                        value
                    });
                }

                break;

            case 'address':

                if (!new RegExp('^0x[a-fA-F0-9]{40}$').test(value)) {

                    throw new ExpectError(ADDRESS_REQUIRED, {
                        expected: 'address',
                        key,
                        value
                    });
                }

                break;

            case 'member':
                
                if (!model[key].provider || typeof model[key].provider !== 'object') {

                    throw new ExpectError(`Provider object must be defined as "provider" model option for "${key}"`);
                }

                let memberValue = value.split('.').reduce((acc, part) => {
                    return acc && acc[part] !== undefined ? acc[part] : null;
                }, model[key].provider);

                if (!memberValue) {

                    throw new ExpectError('Not a member', {
                        expected: model[key].type,
                        provider: model[key].provider,
                        key,
                        value
                    });
                }

                break;

            default:
                
                if (typeof value !== model[key].type && 
                    (model[key].required === true || model[key].required === undefined)) {

                    throw new ExpectError(WRONG_TYPE, {
                        expected: model[key].type,
                        key,
                        value
                    });
                }
        }
    }
};
