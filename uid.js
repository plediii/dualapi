/*jslint node: true */
/* global -Promise */
"use strict";


var crypto = require('crypto');
var cryptoSupport = false;
var Promise = require('bluebird');
var _ = require('lodash');

try {
    var rand = crypto.rng(10);
    cryptoSupport = true;
}
catch (e) {
    console.error('Crypto RNG is not available: ', e);
}

var digest = function (a, b) {
    var shasum = crypto.createHash('sha256');
    shasum.update(a);
    if (b) {
        shasum.update(b);
    }
    return shasum.digest('hex');
};

var keygen = (function () {
    var keylen = 48;
    if (cryptoSupport) {
        var uidsafe = require('uid-safe');
        return function () {
            return uidsafe(keylen);
        };
    }
    else {
        return function () {
            var u = '';
            var d = Date.now();
            for (var i = 0; i < keylen; i++) {
                u += (((d + Math.random() * 16) % 16) | 0).toString(16);
                d = Math.floor(d/16);
            }
            return Promise.resolve(u);
        };
    }
})();

var key = keygen();
var regen = _.throttle(function () {
    keygen()
        .then(function (newkey) {
            key = Promise.resolve(digest(key, newkey));
        })
}, 60000);
setInterval(regen, 1000 * 60 * 10);

var counter = 0;
var previousUid = '';

module.exports = function () {
    return key.then(function (k) {
        previousUid = digest(previousUid + k + (counter++) + Date.now());
        return previousUid;
    });
};

module.exports.regen = regen;
