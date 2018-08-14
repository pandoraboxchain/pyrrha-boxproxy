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
 * @returns {Promise}
 */
module.exports.subscribeDatasetAdded = async (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    const datasetAdded = await pjs.api.datasets.eventDatasetAdded(options);
    return datasetAdded
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
 * @returns {Promise}
 */
module.exports.subscribeDatasetRemoved = async (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    const datasetRemoved = await pjs.api.datasets.eventDatasetRemoved(options);
    return datasetRemoved
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
