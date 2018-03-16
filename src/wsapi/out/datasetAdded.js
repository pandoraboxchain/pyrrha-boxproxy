'use strict';
const store = require('../../store');

const { 
    datasets: {
        eventDatasetAdded
    } 
} = store.get('pjs');

module.exports = push => {

    // Listen for new DatasetAdded
    eventDatasetAdded(
        caddedDatasetStore => push(caddedDatasetStore), 
        err => push({
            error: err.message,
            event: 'PandoraMarket.DatasetAdded'
        }));
};
