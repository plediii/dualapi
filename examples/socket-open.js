

var dual = require('../index');
var io = require('./mock-io');

var server = dual();
server
    .mount(['greeting', 'english'], {
        hello: function (ctxt) {
            ctxt.reply('Hello');
        }
        , goodbye: function (ctxt) {
            ctxt.reply('Goodbye');
        }
    });

server
    .mount(['greeting', 'francais'], {
        hello: function (ctxt) {
            ctxt.reply('Bonjour');
        }
        , goodbye: function (ctxt) {
            ctxt.reply('Au revoir');
        }
    });


server
    .mount(['greetcast'], dual.broadcaster(function (ctxt, allow) {
        allow(true);
    }));


io.listen().on('connect', function (aliceSocket) {
    server
        .mount(['alice', '**'], function (ctxt) {
            aliceSocket.emit('message', {
                to: ctxt.to.slice(1)
                , from: ctxt.from
                , body: ctxt.body
            });
        });
    aliceSocket.on('message', function (ctxt) {
        server
            .send(ctxt.to, ['alice'].concat(ctxt.from), ctxt.body);
    });
});

var alice = dual();
var serverSocket = io.connect();
alice
    .mount(['server', '**'], function (ctxt) {
        serverSocket.emit('message', {
            to: ctxt.to.slice(1)
            , from: ctxt.from
            , body: ctxt.body
        });
    });

serverSocket.on('message', function (ctxt) {
    alice.send(ctxt.to, ['server'].concat(ctxt.from), ctxt.body);
});

serverSocket.on('connect', function () {

    alice
        .get(['server', 'greeting', 'english', 'hello'])
        .then(function (ctxt) {
            console.log(ctxt.body)
        });

    alice
        .get(['server', 'greeting', 'francais', 'goodbye'])
        .then(function (ctxt) {
            console.log(ctxt.body);
        });


    alice
        .live(['server', 'greetcast'])
        .then(function (greetcast) {
            greetcast.on('message', function (ctxt) {
                console.log('broadcast: ', ctxt.body);
            });
            alice
                .send(['server', 'greetcast', 'broadcast'], [], 'HELLOOOO');
        });

});
