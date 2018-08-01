'use strict';

/**
 * Fetching datasets
 *
 * @param {Object} pjs Pjs instance
 * @returns {Promise} {Array[{Object}]}
 */
module.exports.getDatasetsRecords = async (pjs) => {
    
    const blockNumber = await pjs.web3.eth.getBlockNumber();
    const { records, error } = await pjs.api.datasets.fetchAll();

    return {
        records,
        blockNumber,
        error
    };
};

/**
 * Subscribe to DatasetAdded event
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} options eventDatasetAdded, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Object}
 */
module.exports.subscribeDatasetAdded = (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.datasets.eventDatasetAdded(options)
            .data(async ({records, event}) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records,
                        event,
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};

/**
 * Subscribe to DatasetRemoved event
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} options eventDatasetRemoved, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Object}
 */
module.exports.subscribeDatasetRemoved = (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.datasets.eventDatasetRemoved(options)
            .data(async ({records, event}) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records,
                        event,
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};
