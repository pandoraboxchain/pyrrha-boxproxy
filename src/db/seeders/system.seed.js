const { Op } = require('sequelize');
const config = require('../../../config');

module.exports = {
    name: 'systems',
    up: (queryInterface, Sequelize) => {

        return queryInterface.bulkInsert('systems', [
            {
                name: 'alreadySeeded',
                value: 'yes'
            },
            {
                name: 'kernelsBaseline',
                value: 'no'
            },
            {
                name: 'datasetsBaseline',
                value: 'no'
            },
            {
                name: 'workersBaseline',
                value: 'no'
            },
            {
                name: 'jobsBaseline',
                value: 'no'
            },
            {
                name: 'contract.Pandora',
                value: config.addresses.Pandora
            },
            {
                name: 'contract.PandoraMarket',
                value: config.addresses.PandoraMarket
            }
        ]);
    },

    down: (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete('systems', {});
    }
};
