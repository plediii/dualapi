/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

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
