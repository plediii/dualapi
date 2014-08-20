/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('mounted host', function () {

        var dual = dualapi();
        
        it('should be triggered on target message', function (done) {
            dual.mount(['host'], function () {
                done();
            });

            dual.send(['host']);
        });

        it('should be triggered with destination field in context', function (done) {
            dual.mount(['hostA'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['hostA']);
                done();
            });

            dual.send(['hostA']);
        });

        it('should be triggered with from field', function (done) {
            dual.mount(['hostB'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['sourceA']);
                done();
            });
            dual.send(['hostB'], ['sourceA']);
        });

        it('should be triggered with undefined body when on body is provided', function (done) {
            dual.mount(['hostC'], function (ctxt) {
                assert(_.isUndefined(ctxt.body));
                done();
            });

            dual.send(['hostC'], ['sourceB']);
        });

        it('should be triggered with source body when one is provided', function (done) {
            dual.mount(['hostD'], function (ctxt) {
                assert.deepEqual(ctxt.body, {a: 1});
                done();
            });

            dual.send(['hostD'], [], {a: 1});
        });

        it('should NOT be triggered on target message for other hosts', function (done) {
            var received = 0;
            dual.mount(['hostE'], function () {
                received++;
            });
            dual.mount(['host1'], function () {
                assert.equal(received, 0);
                received++;
                done();
            });

            dual.send(['host1']);
        });

    });

});
