'use strict';
const pack = require('../../../package.json');
const config = require('../../../config');

// @route /system/version
module.exports.getVersion = (req, res, next) => {

    res.status(200).json({ version: pack.version });
};

// @route /system/addresses
module.exports.getAddresses = (req, res, next) => {

    res.status(200).json(config.addresses);
};
