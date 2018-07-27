'use strict';

/**
 * Fetching workers
 *
 * @param {Object} pjs Pjs instance
 * @returns {Promise} {Array[{Object}]}
 */
module.exports.getWorkersRecords = async (pjs) => {
    
    const blockNumber = await pjs.web3.eth.getBlockNumber();
    const { records, error } = await pjs.api.workers.fetchAll();

    return {
        records,
        blockNumber,
        error
    };
};

/**
 * Subscribe to WorkerNodeCreated event
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} options eventWorkerNodeCreated, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Promise}
 */
module.exports.subscribeWorkerAdded = async (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.workers.eventWorkerNodeCreated(options)
            .data(async (addedWorker) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [addedWorker.worker],
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};

/**
 * Subscribe to WorkerNodeStateChanged event
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} address Worker address
 * @param {Object} options eventWorkerNodeStateChanged, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Promise}
 */
module.exports.subscribeWorkerNodeStateChanged = async (pjs, address, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.workers.eventWorkerNodeStateChanged(address, options)
            .data(async (changedWorker) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [changedWorker.worker],
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};
