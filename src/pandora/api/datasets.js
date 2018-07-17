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

    if (Array.isArray(error) && error.length > 0) {

        throw error;
    }

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

    pjs.api.datasets.eventDatasetAdded(options)
            .data(async (addedDataset) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [addedDataset],
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

    pjs.api.datasets.eventDatasetRemoved(options)
            .data(async (removedDataset) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [removedDataset],
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};
