'use strict';
const store = require('../../store');

const { 
    kernels: {
        eventKernelAdded
    } 
} = store.get('pjs');

module.exports = push => {

    // Listen for new KernelAdded
    eventKernelAdded(
        caddedKernelStore => push(caddedKernelStore), 
        err => push({
            error: err.message,
            event: 'PandoraMarket.KernelAdded'
        }));
};
