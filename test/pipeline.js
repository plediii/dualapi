/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    describe('pipeline', function () {

        var dual = dualapi();
        
        it('a sequence of hosts at the same mount point are chained with next', function (done) {
            dual.mount(['assembly', 'point1'], function (ctxt, next) {
                next();
            });
            dual.mount(['assembly', 'point1'], function (ctxt, next) {
                done();
            });
            dual.send(['assembly', 'point1']);
        });

        it('a sequence of hosts at the same mount point can be blocked by neglecting next', function (done) {
            var count = 0;
            dual.mount(['assembly2', 'point1'], function (ctxt, next) {
                received1++;
                if (received1 > 1) {
                    done();
                }
            });

            dual.mount(['assembly2', 'point1'], function (ctxt, next) {
                assert(false);
            });

            dual.send(['assembly2', 'point1']);
            dual.send(['assembly2', 'point1']);
        });

        it('a sequence of hosts at the same mount point receive the same ctxt', function (done) {
            dual.mount(['assembly3', 'point1'], function (ctxt, next) {
                ctxt.robotarm = true;
                next();
            });

            dual.mount(['assembly3', 'point1'], function (ctxt, next) {
                assert(ctxt.robotarm);
                done();
            });

            dual.send(['assembly3', 'point1']);
        });


        it('hosts closer to the root on a hierarchy are called before descendants', function (done) {
            var called = 0;
            dual.mount(['assembly4', 'robot', 'arm'], function (ctxt, next) {
                assert.equal(1, called);
                done();
            });

            dual.mount(['assembly4', '**'], function (ctxt, next) {
                called++;
                next();
            });

            dual.send(['assembly4', 'robot', 'arm']);
        });

    });

});
