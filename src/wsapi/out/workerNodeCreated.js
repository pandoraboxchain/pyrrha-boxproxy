'use strict';
const store = require('../../store');

const { 
    workers: {
        eventWorkerNodeCreated,
        eventWorkerNodeStateChanged
    } 
} = store.get('pjs');

module.exports = push => {

    // Listen for new WorkerNode created
    eventWorkerNodeCreated(createdWorkerStore => {
        push(createdWorkerStore);

        // And then listen for changes on this worker
        eventWorkerNodeStateChanged(createdWorkerStore.address, 
            changedWorkerStore => push(changedWorkerStore), 
            err => push({
                error: err.message,
                event: 'WorkerNode.StateChanged'
            }));
    }, err => push({
        error: err.message,
        event: 'Pandora.WorkerNodeCreated'
    }));
};
