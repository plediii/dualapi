

var dual = require('../index');

var server = dual();
var alice = dual();

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
    .mount(['alice', '**'], function (ctxt) {
        alice.send(ctxt.to.slice(1), ['server'].concat(ctxt.from), ctxt.body);
    });

alice
    .mount(['server', '**'], function (ctxt) {
        server.send(ctxt.to.slice(1), ['alice'].concat(ctxt.from), ctxt.body);
    });


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


server
    .mount(['greetcast'], dual.broadcaster(function (ctxt, allow) {
        allow(true);
    }));

alice
    .live(['server', 'greetcast'])
    .on('message', function (ctxt) {
        console.log('broadcast: ', ctxt.body);
    });
server
    .send(['greetcast', 'broadcast'], [], 'HELLOOOO');

