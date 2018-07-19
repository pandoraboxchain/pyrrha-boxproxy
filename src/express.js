'use strict';
const log = require('./logger');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');

module.exports = (config) => {
    const app = express();

    app.set('trust proxy', 1);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json({ limit: '5mb' }));
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 
                   'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    app.use(helmet());

    const server = app.listen(config.port, () => {
        log.info(`Server running at ${config.port} port`);
    });

    return app;
};
