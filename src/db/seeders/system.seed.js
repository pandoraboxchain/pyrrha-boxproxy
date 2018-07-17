const { Op } = require('sequelize');

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
                name: 'blockNumber',
                value: '0'
            }
        ]);
    },

    down: (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete('systems', {
            where: {
                name: {
                    [Op.or]: [
                        'alreadySeeded',
                        'kernelsBaseline',
                        'datasetsBaseline',
                        'workersBaseline',
                        'jobsBaseline',
                        'blockNumber'
                    ]
                }
            }
        });
    }
};
