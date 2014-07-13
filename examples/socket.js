

var dual = require('../index');

var socket = (function () {
    
    var sideA = new EventEmitter();
    var sideB = new EventEmitter();
    var sideAemit = sideA.emit;
    var sideBemit = sideB.emit;
    
    _.extend(sideA, {
        emit: function () {
            sideBemit.apply(sideB, arguments);
        }
    });

    _.extend(sideB, {
        emit: function () {
            sideAemit.apply(sideA, arguments);
        }
    });

    return {
        sideA: sideA
        , sideB: sideB
    };
})();

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
    .mount(['greetcast'], dual.broadcaster(function (ctxt, allow) {
        allow(true);
    }));

serverSocket = socket.sideA;
aliceSocket = socket.sideB;

alice.mount(['grant', 'greeting', 'english'], function () {
    alice
        .get(['server', 'greeting', 'english', 'hello'])
        .then(function (ctxt) {
            console.log(ctxt.body)
        });
});

alice.mount(['grant', 'greeting', 'francais'], function () {
    alice
        .get(['server', 'greeting', 'francais', 'goodbye'])
        .then(function (ctxt) {
            console.log(ctxt.body);
        });
});

alice.mount(['grant', 'greetcast'], function () {
    alice
        .live(['server', 'greetcast'])
        .then(function (greetcast) {
            greetcast.on('message', function (ctxt) {
                console.log('broadcast: ', ctxt.body);
            });
            server
                .send(['greetcast', 'broadcast'], [], 'HELLOOOO');
        });
});

alice.open(aliceSocket, ['server']);
serverSocket.on('connect', function () {
    var f = server.firewall(severSocket, ['alice']);
    f.grant(['greeting', '**']);
    f.grant(['greetcast', '**']);
});


aliceSocket.emit('connect');
