'use strict';

/**
 * Fetching kernels
 *
 * @param {Object} pjs Pjs instance
 * @returns {Promise} {Array[{Object}]}
 */
module.exports.getKernelsRecords = async (pjs) => {
    
    const blockNumber = await pjs.web3.eth.getBlockNumber();
    const { records, error } = await pjs.api.kernels.fetchAll();

    return {
        records,
        blockNumber,
        error
    };
};

/**
 * Subscribe to KernelAdded event
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} options eventKernelAdded, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Object}
 */
module.exports.subscribeKernelAdded = (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.kernels.eventKernelAdded(options)
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
 * Subscribe to KernelRemoved event
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} options eventKernelRemoved, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Object}
 */
module.exports.subscribeKernelRemoved = (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.kernels.eventKernelRemoved(options)
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
