/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi uid', function () {

    var dual = dualapi();

    it("should return a promise resolving to string", function (done) {
        dual.uid()
        .then(function (uid) {
            assert(_.isString(uid));
            done();
        });
    });

    it("should return a promise resolving to string after regen", function (done) {
        dual.uid.regen()
            .then(function (regenresult) {
                assert(!regenresult); // nothing useful to return here
                return dual.uid();
            })
            .then(function (uid) {
                assert(_.isString(uid));
                done();
            })
            .catch(done);
    });

});
