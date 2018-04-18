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
        .then(createdJobStore => {
            push(createdJobStore);

            // And then listen for changes on this job
            eventCognitiveJobStateChanged(createdJobStore.address)
                .then(changedJobStore => push(changedJobStore))
                .catch(err => push({
                    error: err.message,
                    event: 'CognitiveJob.StateChanged'
                }));
        })
        .catch(err => push({
            error: err.message,
            event: 'Pandora.CognitiveJobCreated'
        }));
};
