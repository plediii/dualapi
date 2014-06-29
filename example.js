
var xml = require('xml4node');
var dual = require('./index');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;


var exampleHost = function () {
    var doc = xml.doc(xml.elt('doc'));

    var host = new dual.Host();
    host.action('get')
        .route(['site'])
        .use(function (route, msg, remote) {
            var targetNode = xml.docGet(doc, route);
            if (targetNode) {
                remote.trigger('put', ['site'].concat(_.initial(route)), xml.nodeToString(targetNode));
            }
        });

    host.action('put')
        .route(['site'])
        .use(function (route, msg) {
            xml.setNode(xml.docGet(doc, route), msg);
        });

    host.doc = doc;
    return host;
};

var hostA = exampleHost();
var hostB = exampleHost();

hostA.trigger('put', ['site', 'doc'], xml.elt('bands', [xml.elt('beatles'), xml.elt('doors')]));

if (true) {
    var socket = (function () {
        
        var sideA = new EventEmitter();
        var sideB = new EventEmitter();
        
        _.extend(sideA, {
            trigger: function () {
                sideB.emit.apply(sideB, arguments);
            }
        });

        _.extend(sideB, {
            trigger: function () {
                sideA.emit.apply(sideA, arguments);
            }
        });

        return {
            sideA: sideA
            , sideB: sideB
        }
    })();

    hostA.serve(socket.sideA);
    hostB.serve(socket.sideB);
    socket.sideB.trigger('get', ['site', 'doc', 'bands']);
}
else {
    hostA.serve(hostB);
    hostB.emit('get', ['site', 'doc', 'bands']);
}


console.log(hostA.doc.root);
console.log(hostB.doc.root);
