const path = require('path');
const Sequelize = require('sequelize');

module.exports.createDatabase = async (name) => {
    const db = new Sequelize(`${name}Database`, null, null, {
        dialect: 'sqlite',
        storage: path.resolve(__dirname, `${name}.db`),
        operatorsAliases: false,
        logging: false //data => console.log('Sequelize: ', data)
    });
    await db.authenticate();
    return db;
};

module.exports.createModel = async (db, name, scheme) => {

    const model = db.define(name, {
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

    return await model.sync();
};
