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

    describe('single star wild cards', function () {

        var dual = dualapi();
        
        it('should be host mount points', function () {
            var received = 0;
            dual.mount(['wild', '*'], function () {
                received++;
            });

            dual.send(['wild', 'whatever']);
            assert.equal(received, 1);

        });

        it('should not receive from longer destinations', function () {
            var received = 0;
            dual.mount(['wild1', '*'], function () {
                received++;
            });

            dual.send(['wild1', 'whatever', 'whatever2']);
            assert.equal(received, 0);
        });

        it('should receive message with destination', function () {
            dual.mount(['wild2', '*'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['wild2', 'conservative']);
            });

            dual.send(['wild2', 'conservative']);
        });

        it('should receive message with from', function () {
            dual.mount(['wild3', '*'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['democrat', 'donkey']);
            });

            dual.send(['wild3', 'republican'], ['democrat', 'donkey']);
        });

        it('should be possible intermediate positions', function () {
            var received = 0;
            dual.mount(['wild4', '*', 'future'], function () {
                received++;
            });

            dual.send(['wild4', 'back2', 'future']);
            assert.equal(received, 1);
        });

        it('should not receive from shorter destinations', function () {
            var received = 0;
            dual.mount(['wild5', '*'], function () {
                received++;
            });

            dual.send(['wild5']);
            assert.equal(received, 0);
        });

    });

    describe('double star wild cards', function () {

        var dual = dualapi();
        
        it('should be host mount points', function () {
            var received = 0;
            dual.mount(['toowild', '**'], function () {
                received++;
            });

            dual.send(['toowild', 'whatever']);
            assert.equal(received, 1);

        });

        it('*should* receive from longer destinations', function () {
            var received = 0;
            dual.mount(['toowild1', '**'], function () {
                received++;
            });

            dual.send(['toowild1', 'whatever', 'whatever2']);
            assert.equal(received, 1);
        });

        it('*should* receive from shorter destinations', function () {
            var received = 0;
            dual.mount(['toowild2', '**'], function () {
                received++;
            });

            dual.send(['toowild2']);
            assert.equal(received, 1);
        });

        it('should receive message with destination', function () {
            dual.mount(['toowild3', '**'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['toowild3', 'rabbit']);
            });

            dual.send(['toowild3', 'rabbit']);
        });

        it('should receive message with from', function () {
            dual.mount(['toowild4', '**'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['kellog', 'cornflakes']);
            });

            dual.send(['toowild4', 'astronomy'], ['kellog', 'cornflakes']);
        });

    });

});
