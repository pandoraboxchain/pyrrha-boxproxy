'use strict';
const store = require('../../store');

const {
    datasets: {
        eventDatasetAdded
    }
} = store.get('pjs');

module.exports = push => {

    // Listen for new DatasetAdded
    eventDatasetAdded()
        .then(addedDatasetStore => push(addedDatasetStore))
        .catch(err => push({
            error: err.message,
            event: 'PandoraMarket.DatasetAdded'
        }));
};
