
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

var dual = require('../index');

var serverDomain = dual();
var allenDomain = dual();

serverDomain
    .host('greeting')
    .endpoint('english', {
        hello: function (ctxt, to, from, body) {
            ctxt.reply('Hello.');
        }
        , goodbye: function (ctxt, to, from, body) {
            ctxt.root.send(from, ctxt.to, 'Goodbye.');
        }
    });


serverDomain
    .host('greeting')
    .endpoint('francais', {
        hello: function (ctxt, to, from, body) {
            ctxt.root.send(from, ctxt.to, 'Bonjour.');
        }
        , goodbye: function (ctxt, to, from, body) {
            ctxt.root.send(from, ctxt.to, 'Au revoir.');
        }
    });

serverDomain.connectSocket('clientAllen', socket.sideA);
allenDomain.connectSocket('server', socket.sideB);

allenDomain
    .get(['server', 'greeting', 'english', 'hello'])
    .response(function (from, body) {
        console.log(body);
    });

allenDomain
    .get(['server', 'greeting', 'francais', 'goodbye'])
    .response(function (from, body) {
        console.log(body)
    });


allenDomain
    .endpoint('winStream', {
        win: function(from, body) {
            console.log('Me: ', body, 'Them: 0');
        }
    });

var winCount = 0;
setInterval(function () {
    winCount += 1;
    serverDomain.send(['clientAllen', 'winStream'], [], winCount);
}, 5000);
