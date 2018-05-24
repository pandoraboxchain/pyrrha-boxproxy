'use strict';
const store = require('../../store');

// @route /system/version
module.exports.getVersion = (req, res, next) => {

    const version = store.get('version');
    res.status(200).json({ version });
};

// @route /system/addresses
module.exports.getAddresses = (req, res, next) => {

    const addresses = store.get('config').addresses;
    res.status(200).json(addresses);
};
