var config = require('config');
var logger = require('winston');
var Sequelize = require('sequelize');

config = config.get('db');
var db = new Sequelize(config.database, config.login, config.password, {
    dialect: 'postgres'
});
db.sync();

var Transaction = db.define('Transaction', {
    clientHash: Sequelize.STRING,
    customerId: Sequelize.STRING,
    amount: Sequelize.FLOAT,
    success: Sequelize.BOOLEAN
}, {
    tableName: "transaction"
});

module.exports = {
    save: function (hash, customerId, amount, success) {
        logger.info("[Transaction] Saving data %s", hash); 
        Transaction.create({
            clientHash: hash,
            customerId: customerId,
            amount: amount,
            success: !!success
        });
        Transaction.sync();
    }
}
