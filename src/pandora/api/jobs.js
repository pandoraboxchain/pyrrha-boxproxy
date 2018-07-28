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
 * @returns {Object}
 */
module.exports.subscribeCognitiveJobCreated = (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.jobs.eventCognitiveJobCreated(options)
            .data(async (evt) => {

                try {

                    const blockNumber = await pjs.web3.eth.getBlockNumber();

                    dataCallback({
                        records: [...evt.records],
                        blockNumber
                    });
                } catch (err) {
                    errorCallback(err);
                }
            })
            .error(errorCallback);
};

/**
 * Subscribe to event JobStateChanged for CognitiveJob
 *
 * @param {Object} pjs Pjs instance
 * @param {Object} options eventCognitiveJobStateChanged, see pyrrha-js for details
 * @param {Function} dataCallback Return { records: Array[Object], blockNumber: Number }
 * @param {Function} errorCallback
 * @returns {Object}
 */
module.exports.subscribeJobStateChanged = (pjs, options = {}, dataCallback = () => {}, errorCallback = () => {}) => {

    return pjs.api.jobs.eventJobStateChanged(options)
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
