/*jslint node: true */
"use strict";

var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

var socket = function () {
    
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
};

var listenEmitter = new EventEmitter();

_.extend(exports, {
    connect: function () {
        var s = socket();
        setTimeout(function () {
            listenEmitter.emit('connect', s.sideA);
            s.sideA.emit('connect');
        }, 0);
        return s.sideB;
    }
    , listen: function () {
        return listenEmitter;
    }
    , socket: socket
});
