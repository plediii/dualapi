

var dual = require('../index');

var serverDomain = dual();
var allenDomain = dual();

serverDomain
    .host('greeting')
    .host('english')
    .endpoint({
        hello: function (to, from, body) {
            this.root.send(from, [], 'Hello.');
        }
        , goodbye: function (to, from, body) {
            this.root.send(from, [], 'Goodbye.');
        }
    });

serverDomain
    .host('greeting')
    .host('francais')
    .endpoint({
        hello: function (to, from, body) {
            this.root.send(from, [], 'Bonjour.');
        }
        , goodbye: function (to, from, body) {
            this.root.send(from, [], 'Au revoir.');
        }
});

serverDomain.connect('clientAllen', allenDomain);
allenDomain.connect('server', serverDomain);

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

