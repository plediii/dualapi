

var dual = require('../index');

var domain = dual();

domain
    .mount(['greeting', 'english'], {
        hello: function (ctxt) {
            ctxt.reply('Hello');
        }
        , goodbye: function (ctxt) {
            ctxt.reply('Goodbye');
        }
    });

domain
    .mount(['greeting', 'francais'], {
        hello: function (ctxt) {
            ctxt.reply('Bonjour');
        }
        , goodbye: function (ctxt) {
            ctxt.reply('Au revoir');
        }
    });

domain
    .get(['greeting', 'english', 'hello'])
    .then(function (ctxt) {
        console.log(ctxt.body)
    });

domain
    .get(['greeting', 'francais', 'goodbye'])
    .then(function (ctxt) {
        console.log(ctxt.body);
    });

// domain
//     .mount(['greetcast'], dual.broadcaster(function (ctxt, allow) {
//         allow(true);
//     }));

// domain
//     .live(['greetcast'])
//     .then(function (greetcast) {
//         greetcast.on('message', function (ctxt) {
//             console.log('broadcast: ', ctxt.body);
//         });
//     });

// domain
//     .send(['greetcast', 'broadcast'], [], 'HELLOOOO');
