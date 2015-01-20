/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('get', function () {

        var dual;
        beforeEach(function () {
            dual = dualapi();
        });

        it('should provide a promise of the reply from another host', function (done) {
            dual.mount(['resource'], function (ctxt) {
                ctxt.reply('vespene');
            });

            dual.get(['resource']).then(function (ctxt) {
                assert.equal(ctxt.body, 'vespene');
                done();
            });

        });

        it('should send the message as ctxt.body', function (done) {
            dual.mount(['musician'], function (ctxt) {
                assert.equal(ctxt.body, 'ten years');
                done();
            });

            dual.get(['musician'], 'ten years').catch(function (err) {
                done(err);
            });
        });

        it('should attach options', function (done) {
            dual.mount(['scream'], function (ctxt) {
                assert.equal(ctxt.options.corridor, 'thousand');
                done();
            });
            dual.get(['scream'], null, { corridor: 'thousand' });
        });

        it('should timeout when given a timeout option', function (done) {
            dual.mount(['cleveland'], function (ctxt) {});
            dual.get(['cleveland'], null, { timeout: 1 })
            .then(function (ctxt) {
                assert.equal('408', ctxt.options.statusCode);
                done();
            });
        });

        it('should timeout in 1 seconds given a timeout option of 1', function (done) {
            dual.mount(['cleveland'], function (ctxt) {});
            var before = Date.now();
            dual.get(['cleveland'], null, { timeout: 1 })
            .then(function (ctxt) {
                var after = Date.now();
                assert(after - before > 1000);
                assert(after - before < 2000);
                done();
            });
        });

        // mocha needs a special option to do this test
        // it('should timeout in 2 seconds given a timeout option of 2', function (done) {
        //     dual.mount(['cleveland'], function (ctxt) {});
        //     var before = Date.now();
        //     dual.get(['cleveland'], null, { timeout: 2 })
        //     .then(function (ctxt) {
        //         var after = Date.now();
        //         assert(after - before > 2000);
        //         assert(after - before < 3000);
        //         done();
        //     });
        // });

        it('should not timeout when given a timeout option of 0', function (done) {
            dual.mount(['cleveland'], function (ctxt) {
                _.delay(function () {
                    ctxt.reply('years ago');
                }, 1500);
            });
            dual.get(['cleveland'], null, { timeout: 0 })
            .then(function (ctxt) {
                assert.equal(ctxt.body, 'years ago');
                done();
            });
        });

        it('should return unavailable statuscode when not received', function (done) {
            dual.get(['cleveland'])
            .then(function (ctxt) {
                assert.equal(ctxt.options.statusCode, '503');
                done();
            });
        });

        it('should not leak request listeners', function (done) {
            dual.mount(['dernier'], function (ctxt) {
                ctxt.reply('voyage');
            });
            var initialCount = dual.listeners('**').length;
            dual.get(['dernier'], 'last')
                .then(function (ctxt) {
                    assert.equal('voyage', ctxt.body);
                    assert.equal(initialCount, dual.listeners('**').length);
                    done();
                });
        });

    });

});
