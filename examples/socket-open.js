

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
    server.open(['alice'], aliceSocket);
});

var alice = dual();
var serverSocket = io.connect();
alice.open(['server'], serverSocket);

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
        .on('message', function (ctxt) {
            console.log('broadcast: ', ctxt.body);
        });
    alice
        .send(['server', 'greetcast', 'broadcast'], [], 'HELLOOOO');

});
