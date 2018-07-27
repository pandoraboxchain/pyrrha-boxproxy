const { Op } = require('sequelize');
const config = require('../../../config');

module.exports = {
    name: 'jobs',

    down: (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete('jobs', {});
    }
};
