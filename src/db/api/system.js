const { Op } = require('sequelize');
const System = require('../models/system');

module.exports.getAll = async () => {
    return await System.findAll();
};

module.exports.isAlreadySeeded = async () => {
    const alreadySeeded = await System.findOne({
        where: {
            name: 'alreadySeeded',
            value: 'yes'
        }
    });

    return !!alreadySeeded;
};
