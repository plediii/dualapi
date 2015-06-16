/*jslint node: true */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('dual-protocol');

describe('proxy', function () {

    var d;
    beforeEach(function () {
        d = dualproto.use(require('../src/proxy'))();
    });

    it('should be provided on Message', function (done) {
        d.mount(['nice'], function (body, ctxt) {
            assert(_.isFunction(ctxt.proxy));
            done();
        });
        d.send(['nice']);
    });

    it('should send a message to first argument', function (done) {
        d.mount(['lumberjack'], function () {
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack']);
        });
        d.send(['nice']);
    });

    it('should return a spreadable promise', function (done) {
        d.mount(['nice'], function (body, ctxt) {
            assert(_.isFunction(ctxt.proxy(['lumberjack']).spread));
        });
        d.send(['nice']);
    });

     it('should resolve when first argument host responds', function (done) {
         d.mount(['lumberjack'], function (body, ctxt) {
             ctxt.send(ctxt.from);
         });
         d.mount(['nice'], function (body, ctxt) {
             ctxt.proxy(['lumberjack'])
             .then(function () {
                 done();
             })
             .catch(done);
        });
        d.send(['nice']);
    });

    it('should resolve with the response body as first argument', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            ctxt.send(ctxt.from, [], { forget: 'you' });
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'])
                .spread(function (body) {
                    assert.deepEqual({ forget: 'you' }, body);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

    it('should resolve with the response options as second argument', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            ctxt.send(ctxt.from, [], { forget: 'you' }, { read: 'this'});
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'])
                .spread(function (body, options) {
                    assert.deepEqual({ read: 'this' }, body);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

    it('should resolve with the response context as third argument', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            ctxt.send(ctxt.from, ['land'], { forget: 'you' }, { read: 'this'});
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'])
                .spread(function (body, options, respCtxt) {
                    assert.deepEqual(['land'], respCtxt.from);
                    assert.equal(body, respCtxt.body);
                    assert.equal(options, respCtxt.options);
                    assert.equal(d, respCtxt.domain);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });


    it('should timeout with status code 504 when given a timeout option is provided and the host does not respond', function (done) {
        d.mount(['cleveland'], function (body, ctxt) {});
        d.request(['cleveland'], null, { timeout: 0.001 })
            .spread(function (body, options) {
                assert.equal(504, options.statusCode);
                done();
            })
            .catch(done);
    });


    it('should have domain in timeout ctxt', function (done) {
        d.mount(['cleveland'], function (body, ctxt) {});
        d.request(['cleveland'], null, { timeout: 0.001 })
            .spread(function (body, options, ctxt) {
                assert.equal(d, ctxt.domain);
                done();
            })
            .catch(done);
    });

    it('should timeout in 1 seconds given a timeout option of 1', function (done) {
        d.mount(['cleveland'], function (body, ctxt) {});
        var before = Date.now();
        d.request(['cleveland'], null, { timeout: 1 })
            .spread(function () {
                var after = Date.now();
                assert(after - before >= 1000);
                assert(after - before < 2000);
                done();
            })
            .catch(done);
    });

        // mocha needs a special option to do this test
        // it('should timeout in 2 seconds given a timeout option of 2', function (done) {
        //     d.mount(['cleveland'], function (ctxt) {});
        //     var before = Date.now();
        //     d.get(['cleveland'], null, { timeout: 2 })
        //     .spread(function (ctxt) {
        //         var after = Date.now();
        //         assert(after - before > 2000);
        //         assert(after - before < 3000);
        //         done();
        //     });
        // });

    it('should not timeout when given a timeout option of 0', function (done) {
        d.mount(['cleveland'], function (body, ctxt) {});
        d.request(['cleveland'], null, { timeout: 0 })
        .then(function () {
            done('unexpected return');
        })
            .catch(done);
        done();
    });

    it('should return unavailable statusCode 503 when no host matches', function (done) {
        d.request(['cleveland'])
            .spread(function (body, options) {
                assert.equal(503, options.statusCode);
                done();
            })
            .catch(done);
    });

    it('should not leak request listeners', function (done) {
        d.mount(['dernier'], function (body, ctxt) {
            ctxt.send(ctxt.from, [], 'voyage');
        });
        var initialCount = d.listeners('**').length;
        d.request(['dernier'], 'last')
            .spread(function (body) {
                assert.equal('voyage', body);
                assert.equal(initialCount, d.listeners('**').length);
                done();
            })
            .catch(done);
    });

    it('should not leak listeners on timeout ', function (done) {
        d.mount(['cleveland'], function (body, ctxt) {});
        var initialCount = d.listeners('**').length;
        d.request(['cleveland'], null, { timeout: 0.001 })
            .spread(function (body, options) {
                assert.equal(initialCount, d.listeners('**').length);
                done();
            })
            .catch(done);
    });


});
