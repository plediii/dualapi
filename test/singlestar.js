/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

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

});
