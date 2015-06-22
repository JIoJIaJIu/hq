var _ = require('lodash');
var service = require('../modules/payment/payment').Service;
var config = require('config');

var ERROR_CODES = config.get('ERROR_CODES');

describe("Payment create payment validation", function () {
    var orderInfo = {
        price: 100,
        currency: 'USD',
        fullName: "Anrick Burn"
    };

    var paymentInfo = {
        holderName: "Freeda Burn"
        cardNumber: 55122311251294812,
        ccv: 115
    };

    it("right request", function (done) {
        service.createPayment(orderInfo, paymentInfo)
            .then(function (error) {
                expect(error).toBe(null);
                done();
            });
    });

    it("wrong price: not pointed", function (done) {
        var order = _.clone(orderInfo);
        delete order.price;
        service.createPayment(order, paymentInfo)
            .then(function (error) {
                expect(error.order['price'].code).toBe(ERROR_CODES.NULL_OR_ZERO);
                done();
            });
    });

    it("wrong price: asdf", function (done) {
        var order = _.clone(orderInfo);
        order.price = "asdf";
        service.createPayment(order, paymentInfo)
            .then(function (error) {
                expect(error.order['price'].code).toBe(ERROR_CODES.WRONG_TYPE);
                done();
            });
    });

    it("wrong price: -1000", function (done) {
        var order = _.clone(orderInfo);
        order.price = -1000;
        service.createPayment(order, paymentInfo)
            .then(function (error) {
                expect(error.order['price'].code).toBe(ERROR_CODES.WRONG_SIGN);
                done();
        });
    });
});
