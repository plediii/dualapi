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
            var blocked = true;
            dual.mount(['assembly2', 'point1'], function (ctxt, next) {
                count++;
                if (count > 1) {
                    done();
                }
                return next('failure');
            });

            dual.mount(['assembly2', 'point1'], function (ctxt, next) {
                blocked = false;
            });

            dual.send(['assembly2', 'point1']).catch(function (err) {
                assert.equal(err.message, 'failure');
                assert(blocked);

                dual.send(['assembly2', 'point1']).catch(function (err) {
                    assert.equal(err.message, 'failure');
                    assert(blocked);
                });

            });
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

    describe('.forward', function () {

        it('should preserve additional attributes on the context ', function (done) {
            var ctxt = new dualapi.MessageContext({
                domain: {
                    send: function (to, from, body, options) {
                        assert.equal(options.contest, 'winner');
                        done();
                    }
                }
                , to: ['costume', 'party']
                , from: ['century', 'turn']
                , contest: 'winner'
            });
            ctxt.forward(['doctor']);
        });

    });


});
