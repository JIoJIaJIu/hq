var Q = require('q');
var _ = require('lodash');
var logger = require('winston');
var paypal = require('paypal-rest-sdk');
var config = require('config');

var utils = require('../utils');
var transaction = require('../database/transaction');

var ERROR_CODES = config.get('ERROR_CODES');

function Paypal () {
    paypal.configure(config.get('payments.paypal'));
}

Paypal.prototype = {
    createPayment: function (type, data) {
        var self = this;
        if (type !== "card") {
            logger.error("[Paypal] Only type=card supported")
            return utils.rejectedPromise(null);
        }

        var def = Q.defer();
        console.log(this._getPaymentJSON(type, data));
        paypal.payment.create(this._getPaymentJSON(type, data), function (error, payment) {
            logger.info("[Paypal] Payment was created");
            console.log('error, payment', error, payment);
            if (error) {
                def.reject(self._formatError(error));
                return;
            }

            var cardHash = utils.generateCardHash(data.cardNumber, data.ccv);
            var customerId = utils.generateCustomerId(data.fistName, data.lastName);
            transaction.save(cardHash, customerId, data.price, !error);
            def.resolve(payment.id);
        });

        return def.promise
    },

    _getPaymentJSON: function (type, data) {
        var payment = {
            intent: "sale",
            payer: {
                payment_method: type == "card" ? "credit_card" : null,
                funding_instruments: []
            },
            transactions: [{
                amount: {
                    total: String(data.price),
                    currency: data.currency,
                },
                description: "Just for u"
            }]
        }

        if (type === "card") {
            logger.info("[Paypal] Adding credit card");
            payment.payer.funding_instruments.push({
                credit_card: this._getCreditCard(data)
            })
        }

        return JSON.stringify(payment);
    },

    _formatError: function (error) {
        return {
            paypal: utils.Error(ERROR_CODES.SERVER_ERROR, error.response.message)
        }
    },

    _getCreditCard: function (data) {
        var card = {
            type: data.cardType.toLowerCase(),
            number: String(data.cardNumber),
            expire_month: String(data.expMonth),
            expire_year: String(data.expYear),
            cvv2: String(data.ccv),
            first_name: data.holderFirstName,
            last_name: data.holderLastName,
        }

        return card
    }
}

module.exports = {
    Paypal: Paypal
}
