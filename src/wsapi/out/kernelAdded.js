'use strict';
const store = require('../../store');

const {
    kernels: {
        eventKernelAdded
    }
} = store.get('pjs');

module.exports = push => {

    // Listen for new KernelAdded
    const options = {};
    const fromBlock = store.get('lastBlock');

    if (fromBlock) {

        options.fromBlock = fromBlock;
    }

    eventKernelAdded(options)
        .then(addedKernelStore => push(addedKernelStore))
        .catch(err => push({
            error: err.message,
            event: 'PandoraMarket.KernelAdded'
        }));
};
