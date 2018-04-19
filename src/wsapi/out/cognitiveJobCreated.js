'use strict';
const store = require('../../store');

const { 
    jobs: {
        eventCognitiveJobCreated,
        eventCognitiveJobStateChanged
    } 
} = store.get('pjs');

module.exports = push => {

    // Listen for new Jobs created
    const options = {};
    const fromBlock = store.get('lastBlock');

    if (fromBlock) {

        options.fromBlock = fromBlock;
    }

    eventCognitiveJobCreated(options)
        .data(createdJobStore => {
            push(createdJobStore);

            // And then listen for changes on this job
            eventCognitiveJobStateChanged(createdJobStore.address)
                .data(changedJobStore => push(changedJobStore))
                .error(err => push({
                    error: err.message,
                    event: 'CognitiveJob.StateChanged'
                }));
        })
        .error(err => push({
            error: err.message,
            event: 'Pandora.CognitiveJobCreated'
        }));
};
