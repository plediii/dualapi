/*jslint node: true */
"use strict";

var xml = require('xml4node');
var dual = require('../index');
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

    host.action('watch')
        .route(['site'])
        .use(function (route, msg, remote) {
            host.action('put')
                .route(['site'].concat(route))
                .use(function (target, msg) {
                    remote.trigger('put', ['site'].concat(route, target), msg);
                });
        });


    host.doc = doc;
    return host;
};

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
    };
})();

var hostA = exampleHost();
var hostB = exampleHost();

hostA.trigger('put', ['site', 'doc'], xml.elt('bands', [xml.elt('beatles'), xml.elt('doors')]));
hostA.serve(socket.sideA);
hostB.serve(socket.sideB);
socket.sideB.trigger('watch', ['site', 'doc']);

hostA.trigger('put', ['site', 'doc'], xml.elt('bands', [xml.elt('beatles'), xml.elt('doors')]));


console.log('Host A document: ', xml.docToString(hostA.doc));
console.log('Host B document: ', xml.docToString(hostB.doc));