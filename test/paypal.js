var paypal = new (require('../modules/payment/paypal.js').Paypal)();

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

describe("Paypal payment", function () {
    it("valid credit card payment", function (done) {
        paypal.createPayment("card", {
            cardType: "visa",
            cardNumber: 4417119669820331,
            expMonth: 11,
            expYear: 2018,
            ccv: 874,
            holderFirstName: "Joe",
            holderLastName: "Shopper",
            price: 7,
            currency: "USD"
        }).then(function (payment) {
            expect(true).toBe(true);
        }, function () {
            expect(false).toBe(true);
        }).fin(done);
    });

    it("unvalid credit card payment", function (done) {
        paypal.createPayment("card", {amount: 33, cardType: "asiv"})
            .then(function (error) {
                expect(false).toBe(true);
            }, function () {
                expect(true).toBe(true);
            }).fin(done);
    });
})
