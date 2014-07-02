/*jslint node: true */
"use strict";

var xml = require('xml4node');
var dual = require('../index');
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;


var exampleHost = function (mount) {
    if (!_.isArray(mount)) {
        throw 'Bad mount point.';
    }
    var doc = xml.doc(xml.elt('doc'));

    var host = new dual.Host();
    host.action('get')
        .route(mount)
        .use(function (route, msg, remote) {
            if (_.isArray(remote)) {
                var docRoute = ['doc'].concat(route);
                var targetNode = xml.docGet(doc, docRoute);
                if (targetNode) {
                    host.emit('put', remote, xml.nodeToString(targetNode));
                }
            }
        });

    host.action('put')
        .route(mount)
        .use(function (route, msg) {
            var docRoute = ['doc'].concat(route);
            var hostRoute = mount.concat(route);
            xml.setNode(xml.docGet(doc, docRoute), msg);
            host.emit('put', hostRoute, msg);
        });

    host.doc = doc;
    return host;
};

var hostA = exampleHost(['A']);
var hostB = exampleHost(['B']);

hostB.serve(hostA);
hostA.serve(hostB);
hostA.trigger('put', ['A'], xml.elt('bands', [xml.elt('beatles'), xml.elt('doors')]));

console.log('Initially:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));

hostA.trigger('get', ['A', 'bands'], null, ['B']);
console.log('After get request:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));


hostA.trigger('put', ['A', 'bands'], xml.elt('nirvana'));
console.log('After PUT:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));


hostA.trigger('get', ['A', 'bands', 'nirvana'], null, ['B', 'bands']);
console.log('After sub tree GET:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));


_.extend(exports, {
    hostA: hostA
    , hostB: hostB
});
