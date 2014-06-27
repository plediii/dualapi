
var xml = require('xml4node');
var dual = require('./index');
var _ = require('underscore');


var exampleHost = function () {
    var doc = xml.doc(xml.elt('doc'));

    var host = new dual.Host();
    host.action('get')
        .route(['site'])
        .use(function (route, msg, remote) {
            remote.trigger('put', ['site'].concat(_.initial(route)), xml.nodeToString(xml.docGet(route)));
        });

    host.action('put')
        .route(['site'])
        .use(function (route, msg) {
            xml.setNode(xml.docGet(route), msg);
        });

    host.doc = doc;
    return host;
};

var hostA = exampleHost();
var hostB = exampleHost();

hostA.serve(hostB);

hostA.trigger('put', ['site', 'doc'], xml.elt('bands', [xml.elt('beatles'), xml.elt('doors')]));
hostB.emit('get', ['site', 'doc', 'bands']);
console.log(hostB.doc.root);
