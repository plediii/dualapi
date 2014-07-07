

var dual = require('../index');

var domain = dual();

domain
    .host('greeting')
    .host('english')
    .endpoint({
        hello: function (ctxt) {
            ctxt.reply('Hello');
        }
        , goodbye: function (ctxt) {
            ctxt.reply('Goodbye');
        }
    });

domain
    .host('greeting')
    .host('francais')
    .endpoint({
        hello: function (ctxt) {
            ctxt.reply('Bonjour');
        }
        , goodbye: function (ctxt) {
            ctxt.reply('Au revoir');
        }
});

domain
    .get(['greeting', 'english', 'hello'])
    .response(function (ctxt) {
        console.log(body)
    });

domain
    .get(['greeting', 'francais', 'goodbye'])
    .response(function (ctxt) {
        console.log(ctxt.body);
    });

domain
    .pipe(['greeting', 'francais'])
    .send(['hello'])
    .on('message', function (ctxt) {
        console.log('from pipe ', ctxt.body);
        ctxt.pipe.close();
    });
