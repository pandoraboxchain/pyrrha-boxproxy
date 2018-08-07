const { EventEmitter } = require('events');
const { expect } = require('chai');
const { createDatabase, createModel } = require('./helpers/sqlite.helpers');
const Sequelize = require('sequelize');
const { bulkInsertOrUpdate } = require('../../src/db/api/utils/helpers');

describe('Database helpers tests', () => {

    let db;
    let nameValues;

    before(async () => {

        db = await createDatabase('testing');

        nameValues = await createModel(db, 'nameValues', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING,
                unique: true
            },
            value: {
                type: Sequelize.TEXT
            }
        }, {
            timestamps: false
        });        
    });

    after(async () => await db.close());

    it('#bulkInsertOrUpdate should create and update records', async () => {
        const records = [
            {
                name: 'test1',
                value: 'aaa'
            },
            {
                name: 'test2',
                value: 'qqq'
            }
        ];
        await bulkInsertOrUpdate(nameValues, ['name'], records);
        const result1 = await nameValues.findOne({
            where: {
                'name': {
                    [Sequelize.Op.eq]: 'test1'
                }
            }
        });
        expect(result1.value).to.be.equal('aaa');
        await bulkInsertOrUpdate(nameValues, ['name'], [
            {
                name: 'test1',
                value: 'zzz'
            }
        ]);
        const result2 = await nameValues.findOne({
            where: {
                'name': {
                    [Sequelize.Op.eq]: 'test1'
                }
            }
        });
        expect(result2.value).to.be.equal('zzz');
    });

});
