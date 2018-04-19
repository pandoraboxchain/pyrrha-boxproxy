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
    const options = {};
    const fromBlock = store.get('lastBlock');

    if (fromBlock) {

        options.fromBlock = fromBlock;
    }

    eventWorkerNodeCreated(options)
        .data(createdWorkerStore => {
            push(createdWorkerStore);

            // And then listen for changes on this worker
            eventWorkerNodeStateChanged(createdWorkerStore.address)
                .data(changedWorkerStore => push(changedWorkerStore))
                .error(err => push({
                    error: err.message,
                    event: 'WorkerNode.StateChanged'
                }));
        })
        .error(err => push({
            error: err.message,
            event: 'Pandora.WorkerNodeCreated'
        }));
};
