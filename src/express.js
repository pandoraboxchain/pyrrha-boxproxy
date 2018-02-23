'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');

module.exports = (config) => {
    const app = express();

    app.set('trust proxy', 1);
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json({limit: '5mb'}));
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
    app.use(helmet());

    app.listen(config.port, () => {
        console.log(`Server running at ${config.port} port`);
    });

    return app;
};
