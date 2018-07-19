'use strict';

/**
 * Fetching jobs
 *
 * @param {Object} pjs Pjs instance
 * @returns {Promise} {Array[{Object}]}
 */
module.exports.getJobsRecords = async (pjs) => {
    
    const blockNumber = await pjs.web3.eth.getBlockNumber();
    const { records, error } = await pjs.api.jobs.fetchAll();

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
 * Subscribe to CognitiveJobCreated event
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} options eventCognitiveJobCreated, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Promise}
 */
module.exports.subscribeCognitiveJobCreated = async (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.jobs.eventCognitiveJobCreated(options)
            .data(async (addedJob) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [addedJob],
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};

/**
 * Subscribe to event StateChanged for CognitiveJob
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} address Job address
 * @param {Object} options eventCognitiveJobStateChanged, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Promise}
 */
module.exports.subscribeCognitiveJobStateChanged = async (pjs, address, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.jobs.eventCognitiveJobStateChanged(address, options)
            .data(async (changedJob) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [changedJob.job],
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);    
};
