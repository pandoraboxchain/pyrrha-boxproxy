'use strict';

module.exports = async (app) => {

    // System endpoints
    app.use('/system', require('./api/system'));

    // API routes
    app.use('/jobs', require('./api/jobs'));
    app.use('/datasets', require('./api/datasets'));
    app.use('/kernels', require('./api/kernels'));    
    // app.use('/workers', require('./api/workers'));
    
    
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
