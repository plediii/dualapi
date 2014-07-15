
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
