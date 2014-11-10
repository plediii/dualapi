/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi', function () {

    describe('single star wild cards', function () {

        var dual = dualapi();
        
        it('should be host mount points', function (done) {
            dual.mount(['wild', '*'], function () {
                done();
            });
            dual.send(['wild', 'whatever']);
        });

        it('should not receive from longer destinations', function (done) {
            dual.mount(['wild1', '*'], function () {
                assert(false);
            });
            dual.mount(['wild1', '*', '*'], function () {
                done();
            });
            dual.send(['wild1', 'whatever', 'whatever2']);
        });

        it('should receive message with destination', function (done) {
            dual.mount(['wild2', '*'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['wild2', 'conservative']);
                done();
            });
            dual.send(['wild2', 'conservative']);
        });

        it('should receive message with from', function (done) {
            dual.mount(['wild3', '*'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['democrat', 'donkey']);
                done();
            });
            dual.send(['wild3', 'republican'], ['democrat', 'donkey']);
        });

        it('should be possible intermediate positions', function (done) {
            dual.mount(['wild4', '*', 'future'], function () {
                done();
            });
            dual.send(['wild4', 'back2', 'future']);
        });

        it('should not receive from shorter destinations', function (done) {
            dual.mount(['wild5', '*'], function () {
                assert(false);
            });
            dual.mount(['wild5'], function () {
                done();
            });
            dual.send(['wild5']);
        });

    });

});
