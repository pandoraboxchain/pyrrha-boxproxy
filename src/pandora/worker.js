'use strict';
// Process will alive while processGuard equal true
let processGuard = true;

process.on('message', message => {

    switch (message.cmd) {
        case 'stop':
            processGuard = false;            
            break;

        case 'start':
            process.send({
                cmd: 'started'
            });
            break;

        case 'pause':
            process.send({
                cmd: 'paused'
            });
            break;

        case 'getKernelsRecords':
            
            if (message.options.baseline) {

                process.send({
                    cmd: 'kernelsRecords',
                    records: [],
                    baseline: true
                });
            }

            break;

        case 'subscribeKernels':
            process.send({
                cmd: 'kernelsRecords',
                records: [],
                baseline: false
            });
            break;

        default: 
            process.send({
                cmd: 'error',
                error: new Error('Unknown command')
            });
    }
});

setInterval(_ => {

    if (!processGuard) {

        process.exit(0);
    }
}, 1000);
