/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    describe('pipeline', function () {

        var dual = dualapi();
        
        it('a sequence of hosts at the same mount point are chained with next', function () {
            var received1 = 0;
            var received2 = 0;

            dual.mount(['assembly', 'point1'], function (ctxt, next) {
                received1++;
                next();
            });

            dual.mount(['assembly', 'point1'], function (ctxt, next) {
                received2++;
            });

            dual.send(['assembly', 'point1']);
            assert.equal(received1, 1);
            assert.equal(received2, 1);
        });

        it('a sequence of hosts at the same mount point can be blocked by neglecting next', function () {
            var received1 = 0;
            var received2 = 0;
            dual.mount(['assembly2', 'point1'], function (ctxt, next) {
                received1++;
            });

            dual.mount(['assembly2', 'point1'], function (ctxt, next) {
                received2++;
            });

            dual.send(['assembly2', 'point1']);
            assert.equal(received1, 1);
            assert.equal(received2, 0);
        });

        it('a sequence of hosts at the same mount point receive the same ctxt', function () {
            dual.mount(['assembly3', 'point1'], function (ctxt, next) {
                ctxt.robotarm = true;
                next();
            });

            dual.mount(['assembly3', 'point1'], function (ctxt, next) {
                assert(ctxt.robotarm);
            });

            dual.send(['assembly3', 'point1']);
        });


        it('a sequence of hosts at hierarchically are chained by hierarchical depth', function () {
            var received1 = 0;
            var received2 = 0;

            dual.mount(['assembly4', 'robot', 'arm'], function (ctxt, next) {
                received1++;
            });

            dual.mount(['assembly4', '**'], function (ctxt, next) {
                received2++;
                next();
            });

            dual.send(['assembly4', 'robot', 'arm']);
            assert.equal(received1, 1);
            assert.equal(received2, 1);
        });

    });

});
