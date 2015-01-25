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

var digest = function (a) {
    var shasum = crypto.createHash('sha256');
    shasum.update(a);
    return shasum.digest('hex');
};

var keygen = (function () {
    var keylen = 48;
    if (cryptoSupport) {
        var uidsafe = Promise.method(require('uid-safe'));
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

// would be awesome if this was secure
var counter = 0;
var previousUid = '';
var key = keygen();
var regen = function () {
    return Promise.join(
        keygen()
        , key
        , function (newkey, oldkey) {
            key = Promise.resolve(digest(oldkey + newkey + previousUid));
        });
};


module.exports = function () {
    return key.then(function (k) {
        previousUid = digest(previousUid + k + (counter++) + Date.now());
        if (counter % 50 === 0) {
            regen();
        }
        return previousUid.slice(0, 32);
    });
};

module.exports.regen = regen;
