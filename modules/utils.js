var _ = require('lodash');
var Q = require('q');
var md5 = require('md5');

module.exports = {
    /**
     * Test that input string consist only latin letters
     * @param {String} str
     * @return {Boolean} isLatin
     */
    stringIsLatin: function (str) {
        return !_.first(str, function (a) {
            var code = a.charCodeAt(0);
            if (code < 65 || code > 122)
                // space && '
                if (code == 32 || code == 39)
                    return false;

                return true;
        });
    },

    /**
     * Test that input value stores only 0-9 letters or not
     * @param {Number|String} val
     * @return {Boolean} isNumeric
     */
    isNumeric: function (val) {
        if (val === '')
            return false;
        var str = val + '';
        return !/[^\d]/.test(str);
    },

    /**
     * Create Error object
     * @return {Object}
     */
    Error: function (code, msg) {
        return {
            code: code,
            msg: msg,
            datetime: new Date()
        }
    },

    generateCardHash: function (cardNumber, ccv) {
        return md5(cardNumber + "/" + ccv);
    },

    generateCustomerId: function (firstName, lastName) {
        return firstName + "_" + lastName
    },

    rejectedPromise: function (data) {
        var def = Q.defer();
        def.reject(data);
        return def.promise;
    }
    
}
