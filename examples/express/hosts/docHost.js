/*jslint node: true */
"use strict";

var xml = require('xml4node');
var dual = require('dualapi');
var _ = require('underscore');

var docHost = function () {
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
            console.log('client is watching ', route);
            host.action('put')
                .route(['site'].concat(route))
                .use(function (target, msg) {
                    remote.trigger('put', ['site'].concat(route, target), msg);
                });
        });


    host.doc = doc;
    return host;
};

module.exports = docHost;
