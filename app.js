var hapi = require('hapi');

var server = new hapi.Server();
var payment = require('./modules/payment/payment').Service;

server.connection({
    host: 'localhost',
    port: 8080
});

server.views({
    engines: {
        html: require('handlebars')
    }
});

server.route({
    method: 'GET',
    path: '/',
    handler: {
        view: 'index'
    }
});

server.route({
    method: 'POST',
    path: '/payment',
    handler: function (req, rep) {
        var data = req.payload;
        payment.createPayment({
            price: data.price,
            currency: data.currency,
            fullName: data.fullName
        }, {
            cardNumber: data.cardNumber,
            holderName: data.holderName,
            ccv: data.ccv,
            expMonth: data.expMonth,
            expYear: data.expYear,
            nonce: data.nonce
        }).then(function (data) {
            var resp = rep(data);
            console.log('data', data);
            resp.statusCode = 200;
            return resp;
        }, function (error) {
            var resp = rep(error);
            resp.statusCode = 400;
            return resp;
        });
    }
});

// static
server.route({
    method: 'GET',
    path: '/static/{param*}',
    handler: {
        directory: {
            path: 'static'
        }
    }
});

server.start();
