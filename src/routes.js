'use strict';

module.exports = (app) => {

    // API routes
    app.use('/abi', require('./api/abi'));
    app.use('/workers', require('./api/workers'));
    app.use('/jobs', require('./api/jobs'));
    app.use('/datasets', require('./api/datasets'));
    app.use('/kernels', require('./api/kernels'));
    app.use('/store', require('./api/store'));

    app.get('/*', (req, res, next) => {
        const err = new Error('Please use appropriate API route');
        err.code = 400;
        next(err);
    });

    // Error handler
    app.use(function(err, req, res, next) {
        const response = {
            error: {
                code: err.code || 500,
                message: err.message || 'Internal Server Error'
            }
        };

        res.status(response.error.code).json(response);
    });
};
