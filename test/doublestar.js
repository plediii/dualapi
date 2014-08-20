/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    describe('double star wild cards', function () {

        var dual = dualapi();
        
        it('should be host mount points', function (done) {
            dual.mount(['toowild', '**'], function () {
                done();
            });
            dual.send(['toowild', 'whatever']);
        });

        it('*should* receive from longer destinations', function (done) {
            dual.mount(['toowild1', '**'], function () {
                done();
            });
            dual.send(['toowild1', 'whatever', 'whatever2']);
        });

        it('*should* receive from shorter destinations', function (done) {
            dual.mount(['toowild2', '**'], function () {
                done();
            });
            dual.send(['toowild2']);
        });

        it('should receive message with destination', function (done) {
            dual.mount(['toowild3', '**'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['toowild3', 'rabbit']);
                done();
            });
            dual.send(['toowild3', 'rabbit']);
        });

        it('should receive message with from', function (done) {
            dual.mount(['toowild4', '**'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['kellog', 'cornflakes']);
                done();
            });
            dual.send(['toowild4', 'astronomy'], ['kellog', 'cornflakes']);
        });

    });

});
