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
    eventCognitiveJobCreated(createdJobStore => {
        push(createdJobStore);

        // And then listen for changes on this job
        eventCognitiveJobStateChanged(createdJobStore.address, 
            changedJobStore => push(changedJobStore), 
            err => push({
                error: err.message,
                event: 'CognitiveJob.StateChanged'
            }));
    }, err => push({
        error: err.message,
        event: 'Pandora.CognitiveJobCreated'
    }));
};
