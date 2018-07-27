const Sequelize = require('sequelize');
const db = require('./db');

class Migrator {
    constructor(options = {}) {
        this.queryInterface = db.getQueryInterface();
        this.sequelize = Sequelize;
        this.options = {
            migrations: options.migrations || []
        };
    }

    async up(...names) {
        return await Promise.all(this.options.migrations.map(mgr => {

            if (names.length > 0 && !names.includes(mgr.name)) {

                return Promise.resolve();
            }

            return mgr.up ? mgr.up(this.queryInterface, this.sequelize) : Promise.resolve();
        }));
    }

    async down(...names) {
        return await Promise.all(this.options.migrations.map(mgr => {

            if (names.length > 0 && !names.includes(mgr.name)) {

                return Promise.resolve();
            }

            return mgr.down ? mgr.down(this.queryInterface, this.sequelize) : Promise.resolve();
        }));
    }
}

module.exports = migrationsObj => new Migrator(migrationsObj);
