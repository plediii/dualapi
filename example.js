
var xml = require('xml4node');
var dual = require('./index');
var _ = require('underscore');


var exampleHost = function () {
    var doc = xml.doc(xml.elt('bands'));

    var host = new dual.Host();
    host.action('get')
        .route(['site'])
        .use(function (route, msg, remote) {
            remote.trigger('put', ['site'].concat(_.initial(route)), xml.nodeToString(xml.docGet(route)));
        });

    host.action('put')
        .route(['site'])
        .use(function (route, msg) {
            xml.docSet(route, msg);
        });

    host.doc = doc;
    return host;
};

var hostA = exampleHost();
var hostB = exampleHost();

hostA.serve(hostB);

hostA.trigger('put', ['site', 'bands'], xml.elt('beatles'));
hostB.emit('get', ['site', 'bands']);
console.log(hostB.doc.root);
