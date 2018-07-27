const { Op } = require('sequelize');
const config = require('../../../config');

module.exports = {
    name: 'datasets',

    down: (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete('datasets', {});
    }
};
