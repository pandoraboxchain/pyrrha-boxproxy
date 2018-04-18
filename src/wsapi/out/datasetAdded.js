'use strict';
const store = require('../../store');

const {
    datasets: {
        eventDatasetAdded
    }
} = store.get('pjs');

module.exports = push => {

    // Listen for new DatasetAdded
    const options = {};
    const fromBlock = store.get('lastBlock');

    if (fromBlock) {

        options.fromBlock = fromBlock;
    }

    eventDatasetAdded(options)
        .then(addedDatasetStore => push(addedDatasetStore))
        .catch(err => push({
            error: err.message,
            event: 'PandoraMarket.DatasetAdded'
        }));
};
