/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('mounted host', function () {

        var dual = dualapi();
        
        it('should be triggered on target message synchronously', function () {
            var received = 0;
            dual.mount(['host'], function () {
                received++;
            });

            dual.send(['host']);
            assert.equal(received, 1);

        });

        it('should be triggered with destination field in context', function () {
            dual.mount(['hostA'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['hostA']);
            });

            dual.send(['hostA']);
        });

        it('should be triggered with from field', function () {
            dual.mount(['hostB'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['sourceA']);
            });

            dual.send(['hostB'], ['sourceA']);
        });

        it('should be triggered with undefined body when on body is provided', function () {
            dual.mount(['hostC'], function (ctxt) {
                assert(_.isUndefined(ctxt.body));
            });

            dual.send(['hostC'], ['sourceB']);
        });

        it('should be triggered with source body when one is provided', function () {
            dual.mount(['hostD'], function (ctxt) {
                assert.deepEqual(ctxt.body, {a: 1});
            });

            dual.send(['hostD'], [], {a: 1});
        });

        it('should be not triggered on target message for other hosts', function () {
            var received = 0;
            dual.mount(['hostE'], function () {
                received++;
            });

            dual.send(['host1']);
            assert.equal(received, 0);

        });

    });

});
