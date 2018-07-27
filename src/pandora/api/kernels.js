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
 * @returns {Promise}
 */
module.exports.subscribeKernelAdded = async (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.kernels.eventKernelAdded(options)
            .data(async (addedKernel) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [addedKernel.kernel],
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
 * @returns {Promise}
 */
module.exports.subscribeKernelRemoved = async (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.kernels.eventKernelRemoved(options)
            .data(async (removedKernel) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [removedKernel],
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};
