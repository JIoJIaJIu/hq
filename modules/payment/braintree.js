function Braintree () {
}

Braintree.prototype = {
    createPayment: function (data) {
        return null, true
    }
}

module.exports = {
    Braintree: Braintree
}
