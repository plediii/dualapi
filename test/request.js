/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('request', function () {

        var dual;
        beforeEach(function () {
            dual = dualapi();
        });

        it('should provide a promise of the reply from another host', function (done) {
            dual.mount(['resource'], function (ctxt) {
                ctxt.reply('vespene');
            });

            dual.request(['resource']).spread(function (body) {
                assert.equal(body, 'vespene');
                done();
            })
            .catch(done);
        });

        it('should spread the options to second argument', function (done) {
            dual.mount(['resource'], function (ctxt) {
                ctxt.reply('vespene', { statusCode: '1000' });
            });

            dual.request(['resource']).spread(function (body, options) {
                assert.equal(options.statusCode, '1000');
                done();
            })
            .catch(done);
        });

        it('should spread get ctxt to the third argument', function (done) {
            dual.mount(['resource'], function (ctxt) {
                ctxt.reply('vespene', { statusCode: '1001' });
            });

            dual.request(['resource']).spread(function (body, options, ctxt) {
                assert.deepEqual(['resource'], ctxt.from);
                assert.deepEqual(ctxt.body, body);
                assert.deepEqual(ctxt.options, options);
                done();
            })
            .catch(done);
        });


        it('should send the message as ctxt.body', function (done) {
            dual.mount(['musician'], function (ctxt) {
                assert.equal(ctxt.body, 'ten years');
                done();
            });

            dual.request(['musician'], 'ten years')
                .catch(done);
        });

        it('should attach options', function (done) {
            dual.mount(['scream'], function (ctxt) {
                assert.equal(ctxt.options.corridor, 'thousand');
                done();
            });
            dual.request(['scream'], null, { corridor: 'thousand' });
        });

        it('should timeout when given a timeout option', function (done) {
            dual.mount(['cleveland'], function (ctxt) {});
            dual.request(['cleveland'], null, { timeout: 1 })
            .spread(function (body, options) {
                assert.equal('408', options.statusCode);
                done();
            });
        });

        it('should timeout in 1 seconds given a timeout option of 1', function (done) {
            dual.mount(['cleveland'], function (ctxt) {});
            var before = Date.now();
            dual.request(['cleveland'], null, { timeout: 1 })
            .spread(function () {
                var after = Date.now();
                assert(after - before >= 1000);
                assert(after - before < 2000);
                done();
            });
        });

        // mocha needs a special option to do this test
        // it('should timeout in 2 seconds given a timeout option of 2', function (done) {
        //     dual.mount(['cleveland'], function (ctxt) {});
        //     var before = Date.now();
        //     dual.get(['cleveland'], null, { timeout: 2 })
        //     .spread(function (ctxt) {
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
            dual.request(['cleveland'], null, { timeout: 0 })
            .spread(function (body) {
                assert.equal(body, 'years ago');
                done();
            });
        });

        it('should return unavailable statuscode when not received', function (done) {
            dual.request(['cleveland'])
            .spread(function (body, options) {
                assert.equal(options.statusCode, '503');
                done();
            });
        });

        it('should not leak request listeners', function (done) {
            dual.mount(['dernier'], function (ctxt) {
                ctxt.reply('voyage');
            });
            var initialCount = dual.listeners('**').length;
            dual.request(['dernier'], 'last')
                .spread(function (body) {
                    assert.equal('voyage', body);
                    assert.equal(initialCount, dual.listeners('**').length);
                    done();
                });
        });

    });

});
