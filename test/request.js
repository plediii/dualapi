/*jslint node: true */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('dual-protocol');


describe('request', function () {

    var d;
    beforeEach(function () {
        d = dualproto.use(require('../src/request'))();
    });

    it('should return a promise of the reply from another host', function () {
        var r = d.request(['resource']);
        assert(_.isFunction(r.then));
    });

    it('should return a spreadable promise', function () {
        var r = d.request(['resource']);
        assert(_.isFunction(r.spread));
    });

    it('should resolve when the host replies', function (done) {
        d.mount(['resource'], function (body, ctxt) {
            ctxt.send(ctxt.from);
        });
        d.request(['resource']).then(function () {
            done();
        });
    });

    it('should spread the host reply body as the first argument', function (done) {
        d.mount(['resource'], function (body, ctxt) {
            ctxt.send(ctxt.from, [], 'vespene');
        });
        d.request(['resource']).spread(function (body) {
            assert.equal('vespene', body);
            done();
        })
        .catch(done);
    });


    it('should spread the host reply options as the second argument', function (done) {
        d.mount(['resource'], function (body, ctxt) {
            ctxt.send(ctxt.from, [], 'vespene', { statusCode: 1000 });
        });
        d.request(['resource']).spread(function (body, options) {
            assert.equal(1000, options.statusCode);
            done();
        })
        .catch(done);
    });


    it('should spread ctxt to the third argument', function (done) {
        d.mount(['resource'], function (body, ctxt) {
            ctxt.send(ctxt.from, ['suede'], { doorbell: 'vespene' }, { statusCode: 1000 });
        });

        d.request(['resource']).spread(function (body, options, ctxt) {
            assert.deepEqual(['suede'], ctxt.from);
            assert.deepEqual(ctxt.body, { doorbell: 'vespene' });
            assert.deepEqual(ctxt.options, options);
            done();
        })
            .catch(done);
    });

    it('should send the second argument as ctxt.body', function (done) {
        d.mount(['musician'], function (body, ctxt) {
            assert.equal(ctxt.body, 'ten years');
            ctxt.send(ctxt.from);
            done();
        });

        d.request(['musician'], 'ten years')
            .catch(done);
    });

    it('should send the third argument as options', function (done) {
        d.mount(['scream'], function (body, ctxt) {
            assert.equal(ctxt.options.corridor, 'thousand');
            ctxt.send(ctxt.from);
            done();
        });
        d.request(['scream'], null, { corridor: 'thousand' })
        .catch(done);
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

});
