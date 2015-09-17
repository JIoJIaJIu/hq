var _ = require('lodash');
var service = require('../modules/payment/payment').Service;
var config = require('config');

var ERROR_CODES = config.get('ERROR_CODES');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

describe("Payment create payment validation", function () {
    var orderInfo = {
        price: 100,
        currency: 'USD',
        fullName: "Anrick Burn"
    };

    var paymentInfo = {
        holderName: "Freeda Burn",
        cardNumber: 55122311251294812,
        ccv: 115
    };

    it("wrong price: not pointed", function (done) {
        var order = _.clone(orderInfo);
        delete order.price;
        service.createPayment(order, paymentInfo)
            .fail(function (error) {
                expect(error['price'].code).toBe(ERROR_CODES.NULL_OR_ZERO);
            }).fin(done);
    });

    it("wrong price: asdf", function (done) {
        var order = _.clone(orderInfo);
        order.price = "asdf";
        service.createPayment(order, paymentInfo)
            .fail(function (error) {
                expect(error['price'].code).toBe(ERROR_CODES.WRONG_TYPE);
            }).fin(done);
    });

    it("wrong price: -1000", function (done) {
        var order = _.clone(orderInfo);
        order.price = -1000;
        service.createPayment(order, paymentInfo)
            .fail(function (error) {
                expect(error['price'].code).toBe(ERROR_CODES.WRONG_SIGN);
        }).fin(done);
    });
});

describe("Create payments", function () {
    it("Paypal payment", function (done) {
        service.createPayment({
            price: 100,
            currency: "USD",
            fullName: "Anrick Burn",
        }, {
            holderName: "Joe Shopper",
            cardNumber: 4417119669820331,
            ccv: 874,
            expMonth: 11,
            expYear: 2018
        }).then(function (payment) {
            expect(true).toBe(true);
        }, function () {
            expect(false).toBe(true);
        }).fin(done);
    });
});
