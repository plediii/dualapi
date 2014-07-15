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

var socketHost = function (socketside, mount) {
    if (!_.isArray(mount)) {
        throw 'Bad remote mount.';
    }

    var host = new dual.Host();

    _.each(['get', 'put'], function (action) {
        host.action(action)
            .route(mount)
            .use(function (route, msg, remote) {
                socketside.emit(action, route, msg, remote);
            });

        socketside.on(action, function (route, msg, remote) {
            host.emit(action, route, msg, mount.concat(remote));
        });
    });

    socketside.on('put', function (subroute, msg, subremote) {
        if (subroute[0] === 'subscribe') {
            var subtarget = subroute.slice(1);
            host.action('put')
            .route(subtarget)
            .use(function (putroute, msg, putremote) {
                socketside.emit('put', subremote.concat(putroute), msg, putremote);
            });
        }
    });

    return host;
};

var hostA = exampleHost(['A']);
hostA.connect(socketHost(socket.sideA, ['siteB']));

var hostB = exampleHost(['B']);
hostB.connect(socketHost(socket.sideB, ['siteA']));



hostA.trigger('put', ['A'], xml.elt('bands', [xml.elt('beatles'), xml.elt('doors')]));

console.log('Initially:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));

hostB.emit('get', ['siteA', 'A', 'bands'], null, ['B']);
console.log('After get request:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));


hostA.trigger('put', ['A', 'bands'], xml.elt('nirvana'));
console.log('After PUT:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));


hostB.emit('get', ['siteA', 'A', 'bands', 'nirvana'], null, ['B', 'bands']);
console.log('After sub tree GET:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));

hostB.emit('put', ['siteA', 'subscribe', 'A', 'bands'], null, ['B', 'bands']);
hostA.trigger('put', ['A', 'bands'], xml.elt('stones'));
console.log('After subscription and PUT:');
console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));



_.extend(exports, {
    hostA: hostA
    , hostB: hostB
});
