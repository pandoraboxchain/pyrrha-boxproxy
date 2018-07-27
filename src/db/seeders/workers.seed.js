const { Op } = require('sequelize');
const config = require('../../../config');

module.exports = {
    name: 'workers',

    down: (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete('workers', {});
    }
};
