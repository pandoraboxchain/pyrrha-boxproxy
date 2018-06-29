const { Op } = require('sequelize');
// const System = require('../models/system');

module.exports.isBaseline = async () => {

    return false;
};

module.exports.add = async (data = {}, options = {}) => {
    // return await System.findAll();

    console.log('>>>', data, options);

    if (data.baseline) {

        options.source.emit('subscribeKernels');
    }
};
