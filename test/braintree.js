var braintree = new (require('../modules/payment/braintree.js').Braintree)();

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

describe("Braintree payment", function () {
    it("get client token", function (done) {
        braintree.getClientToken({
            firstName: "Joe",
            lastName: "Shopper"
        }).then(function (a) {
            expect(true).toBe(true);
        }, function (error) {
            expect(true).toBe(false);
        }).fin(done);
    });

    it("valid payment", function (done) {
        braintree.createPayment({
            nonce: "fake-valid-nonce",
            firstName: "Joe",
            lastName: "Shopper",
            price: 100,
            currency: "USD"
        }).then(function () {
            expect(true).toBe(true);
        }, function () {
            expect(true).toBe(false);
        }).fin(done);
    });
});
