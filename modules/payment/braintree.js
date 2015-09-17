var Q = require('q');
var braintree = require('braintree');
var logger = require('winston');

var config = require('config');
var utils = require('../utils');

var ERROR_CODES = config.get('ERROR_CODES');

function Braintree () {
    config = config.get('payments.braintree');

    this._customers = {};
    this._gateway = braintree.connect({
        environment: braintree.Environment.Sandbox,
        merchantId: config.merchantId,
        publicKey: config.publicKey,
        privateKey: config.privateKey
    });
}

Braintree.prototype = {
    createPayment: function (data) {
        var self = this;
        var def = Q.defer();
        var customerId = utils.generateCustomerId(data.firstName, data.lastName);

        this._getCustomer(customerId, data)
            .then(function (customer) {
                self._gateway.transaction.sale({
                    amount: data.price,
                    paymentMethodNonce: data.nonce
                }, function (err, response) {
                    if (response.errors) {
                        def.reject(utils.Error(ERROR_CODES.SERVER_ERROR, response.message));
                        return;
                    }

                    var transaction = response.transaction;
                    def.resolve(transaction.id);
                })
            });

        return def.promise 
    },

    getClientToken: function (data) {
        var self = this;
        var def = Q.defer();
        var customerId = utils.generateCustomerId(data.firstName, data.lastName);
        logger.info("[Braintree] Getting client token %s", customerId)

        this._getCustomer(customerId, data)
            .then(function (customer) {
                self._gateway.clientToken.generate({
                    customerId: customer.id
                }, function (err, response) {
                    if (response.errors) {
                        logger.error("[Braintree] Error during generate client token");
                        def.reject(utils.Error(ERROR_CODES.SERVER_ERROR, response.message));
                        return;
                    }

                    def.resolve(response.clientToken);
                });
            });

        return def.promise;
    },

    _getPaymentMethod: function (customer, nonce, data) {
        var self = this;
        var def = Q.defer();
        var token = utils.generateCardHash(data.cardNumber, data.ccv);
        logger.info("[Braintree] Getting credit card %s", token)

        self._gateway.paymentMethod.create({
            customerId: customer.id,
            paymentMethodNonce: nonce
        }, function (err, paymentMethod) {
            if (err) {
                logger.error("[Braintree] Error during creating payment method")
                def.reject(err)
                return;
            }

            def.resolve(paymentMethod);
        })

        return def.promise
    },

    _getCustomer: function (id, data) {
        logger.info("[Braintree] Getting customer %s", id)
        var def = Q.defer();
        var self = this;

        this._gateway.customer.find(id, function (err, customer) {
            if (customer) {
                self._customers[id] = customer;
                def.resolve(customer);
                return;
            }

            self._gateway.customer.create({
                id: id,
                firstName: data.firstName,
                lastName: data.lastName
            }, function (err, customer) {
                if (err) {
                    logger.error("[Braintree] Error during creating customer")
                    def.reject(err)
                    return;
                }

                self._customers[id] = customer;
                def.resolve(customer);
            });

        });

        return def.promise
    },

    _customers: null
}

module.exports = {
    Braintree: Braintree
}
