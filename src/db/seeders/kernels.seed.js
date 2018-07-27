const { Op } = require('sequelize');
const config = require('../../../config');

module.exports = {
    name: 'kernels',

    down: (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete('kernels', {});
    }
};
