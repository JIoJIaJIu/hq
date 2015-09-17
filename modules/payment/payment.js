var _ = require('lodash');
var Q = require('q');
var logger = require('winston');
var config = require('config');
var md5 = require('md5');

var paypal = require('./paypal');
var braintree = require('./braintree');
var utils = require('../utils');

var CURRENCIES = [
    'USD',
    'EUR',
    'THB',
    'HKD',
    'SGD',
    'AUD'
]

var ERROR_CODES = config.get('ERROR_CODES');

function PaymentService () {
    this._services = {
        braintree: new braintree.Braintree(),
        paypal: new paypal.Paypal()
    }
    logger.info("[Payment] PaymentService was created");
}

PaymentService.prototype = {
    /**
     * @param {Object} orderInfo
     *   @key {Number} price
     *   @key {String} currency, enum
     *   @key {String} fullName, customer full name
     * @param {Object} paymentInfo
     *   @key {String} fullName, holder full name
     *   @key {Number} cardNumber, card number
     *   @key {Number} expMonth
     *   @key {Number} expYear
     *   @key {Number} ccv
     *   @key {String} [nonce]
     * @return {Object} promise
     */
    createPayment: function (orderInfo, paymentInfo) {
        logger.info("[Payment] Request new payment");
        var errors = this._validateOrderInfo(orderInfo);
        _.extend(errors, this._validatePaymentInfo(paymentInfo));
        var self = this;

        if (!_.isEmpty(errors)) {
            logger.info("[Payment] Data is not valid");
            return utils.rejectedPromise(errors);
        }

        logger.info("[Payment] Data is ok");
        var data = self._normalize(orderInfo, paymentInfo);
        if (data.type === 'AMEX') {
            if (data.currency !== 'USD') {
                logger.info("[Payment] Error during processing");
                return utils.rejectedPromise({
                    card: utils.Error(ERROR_CODES.WRONG_CURRENCY, "AMEX is possible to use only for USD")
                })
            }

            return self._services.paypal.createPayment('card', data);
        }

        if (~['USD', 'EUR', 'AUD'].indexOf(data.currency))
            return self._services.paypal.createPayment('card', data);

        if (data.nonce) {
            return self._services.braintree.createPayment(data);
        } else {
            var def = Q.defer();
            self._services.braintree.getClientToken(data)
                .then(function (token) {
                    def.resolve({
                        isBraintree: true,
                        token: token
                    })
                }, function (error) {
                    def.reject(error);
                })
            return def.promise;
        }
    },

    /**
     * Works after validation
     **/
    _normalize: function (order, payment) {
        logger.info("[Payment] Normalize payment and order datas");
        var fullNames = order.fullName.split(' ');
        var holderNames = payment.holderName.split(' ');
        var cardNumber = parseInt(payment.cardNumber, 10);

        var data = {
            price: parseInt(order.price, 10),
            currency: order.currency.toUpperCase(),
            cardNumber: cardNumber,
            cardType: this._determineCardType(cardNumber),
            firstName: fullNames[0],
            lastName: fullNames[1],
            holderFirstName: holderNames[0],
            holderLastName: holderNames[1],
            ccv: parseInt(payment.ccv, 10),

            expMonth: payment.expMonth,
            expYear: payment.expYear,

            nonce: payment.nonce || null // optional
        }

        return data;
    },

    /**
     * http://stackoverflow.com/questions/72768/how-do-you-detect-credit-card-type-based-on-number
     * @ return {String}
     * Variants:
     *  - AMEX
     *  - VISA
     *  - MASTERCARD
     *  - UNKNOWN
     */
    _determineCardType: function (cardNumber) {
        var VISA_REG = /^4[0-9]{6,}$/
        var MASTERCARD_REG = /^5[1-5][0-9]{5,}$/
        var AMEX_REG = /^3[47][0-9]{5,}$/

        if (VISA_REG.test(cardNumber)) {
            return 'VISA';
        } else if (MASTERCARD_REG.test(cardNumber)) {
            return 'MASTERCARD';
        } else if (AMEX_REG.test(cardNumber)) {
            return 'AMEX';
        } else {
            return 'UNKNOWN';
        }
    },

    /**
     * @return {Object} errors, utils.Error
     */
    _validateOrderInfo: function (orderInfo) {
        logger.info("[Payment] Validate order info");
        var errors = {}
        if (_.isEmpty(orderInfo))
            return {
                orderInfo: utils.Error(ERROR_CODES.UNDEFINED, "Should point orderInfo")
            };

        var price = orderInfo.price;
        var fullName = orderInfo.fullName;
        var currency = String.prototype.toUpperCase.call(orderInfo.currency);

        if (!price) {
            errors['price'] = utils.Error(ERROR_CODES.NULL_OR_ZERO,
                                          "Should point price");
        } else if (_.isNaN(parseInt(price, 10)) ) {
            errors['price'] = utils.Error(ERROR_CODES.WRONG_TYPE,
                                          "You pointed wrong price");
        } else if (price < 0) {
            errors['price'] = utils.Error(ERROR_CODES.WRONG_SIGN,
                                          "Point positive value of price");
        }

        if (!fullName) {
            errors['fullName'] = utils.Error(ERROR_CODES.UNDEFINED,
                                             "Should point full name");
        } else if (utils.stringIsLatin(String(fullName))) {
            errors['fullName'] = utils.Error(ERROR_CODES.NOT_LATIN,
                                             "Should point latin name and surname");
        } else if (String(fullName).split(' ').length < 2) {
            errors['fullName'] = utils.Error(ERROR_CODES.WRONG_SIZE,
                                             "Should point full name: name and surname");
        }

        if (!currency) {
            errors['currency'] = utils.Error(ERROR_CODES.NULL_OR_ZERO,
                                             "Should point currency");
        } else if (!~CURRENCIES.indexOf(currency)) {
            errors['currency'] = utils.Error(ERROR_CODES.WRONG_VALUE,
                                             "Should point currency in " + CURRENCIES.join(','));
        }

        logger.info("[Payment] Errors: ", errors);
        return errors;
    },

    /**
     * @return {Object} errors, utils.Error
     */
    _validatePaymentInfo: function (paymentInfo) {
        logger.info("[Payment] Validate payment info");
        var errors = {}
        if (_.isEmpty(paymentInfo))
            return {
                paymentInfo: {
                    code: ERROR_CODES.UNDEFINED,
                    msg: "Should point paymentInfo"
                }
            };

        var holderName = paymentInfo.holderName;
        var cardNumber = paymentInfo.cardNumber;
        var ccv = paymentInfo.ccv;
        var expiration = paymentInfo.expiration;

        if (!holderName) {
            errors['holderName'] = utils.Error(ERROR_CODES.UNDEFINED,
                                               "Should point holder name");
        } else if (utils.stringIsLatin(String(holderName))) {
            errors['holderName'] = utils.Error(ERROR_CODES.NOT_LATIN,
                                               "Should point latin name and surname");
        } else if (String(holderName).split(' ').length < 2) {
            errors['holderName'] = utils.Error(ERROR_CODES.WRONG_SIZE,
                                               "Should point holder name: name and surname");
        }

        if (!cardNumber) {
            errors['cardNumber'] = utils.Error(ERROR_CODES.UNDEFINED,
                                               "Should point card number");
        } else if ((cardNumber + '').length < 14) {
            errors['cardNumber'] = utils.Error(ERROR_CODES.WRONG_SIZE,
                                               "Should point card number with minimum 14 letters");
        } else if ((cardNumber + '').length > 20) {
            errors['cardNumber'] = utils.Error(ERROR_CODES.WRONG_SIZE,
                                              "Should point card number with maximum 14 letters");
        } else if (!utils.isNumeric(cardNumber)) {
            errors['cardNumber'] = utils.Error(ERROR_CODES.WRONG_TYPE,
                                               "Should point decimal(0-9) letters in card number");
        }

        if (!ccv) {
            errors['ccv'] = utils.Error(ERROR_CODES.UNDEFINED,
                                        "Should point ccv");
        } else if ((ccv + '').length != 3) {
            errors['ccv'] = utils.Error(ERROR_CODES.WRONG_SIZE,
                                        "Ccv should be 3 letters");
        } else if (!utils.isNumeric(ccv)) {
            errors['ccv'] = utils.Error(ERROR_CODES.WRONG_TYPE,
                                        "Ccv should be decimal(0-9) letters");
        }
        /*
        @key {String} exp, expiration
        */

        logger.info("[Payment] Errors: ", errors);
        return errors;
    }
}

module.exports = {
    Service: new PaymentService()
}
