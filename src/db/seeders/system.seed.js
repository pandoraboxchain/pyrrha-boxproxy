module.exports = {
    name: 'systems',
    up: (queryInterface, Sequelize) => {

        return queryInterface.bulkInsert('systems', [
            {
                name: 'alreadySeeded',
                value: 'yes'
            }
        ]);
    },

    down: (queryInterface, Sequelize) => {

        return queryInterface.bulkDelete('systems', {
            where: {
                name: 'alreadySeeded'
            }
        });
    }
};
