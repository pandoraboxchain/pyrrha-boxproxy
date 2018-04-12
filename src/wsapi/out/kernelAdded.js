'use strict';
const store = require('../../store');

const {
    kernels: {
        eventKernelAdded
    }
} = store.get('pjs');

module.exports = push => {

    // Listen for new KernelAdded
    eventKernelAdded()
        .then(addedKernelStore => push(addedKernelStore))
        .catch(err => push({
            error: err.message,
            event: 'PandoraMarket.KernelAdded'
        }));
};
