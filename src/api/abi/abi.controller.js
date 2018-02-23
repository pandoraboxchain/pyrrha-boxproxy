'use strict';
const store = require('../../store');
const { pan, wor, cog, dat } = store.get('abis');

// @route /abi
module.exports.getAbi = (req, res, next) => {

    return res.json({
        pan,
        wor,
        cog,
        dat
    });
};
