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

    it('should send a message to with well formed route', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            assert(_.isArray(ctxt.from));
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
            done();
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
                    assert.deepEqual({ read: 'this' }, options);
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

    it('should timeout if given timeout option and host does not respond', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {});
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'], { timeout: 1 })
                .spread(function (body, options, respCtxt) {
                    assert.equal(504, options.statusCode);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

    it('should timeout if given timeout in original options', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {});
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'])
                .spread(function (body, options, respCtxt) {
                    assert.equal(504, options.statusCode);
                    done();
                })
                .catch(done);
        });
        d.send(['nice'], [], void 0, { timeout: 0.01 });
    });

    it('should have domain in timeout ctxt', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {});
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'], { timeout: 1 })
                .spread(function (body, options, respCtxt) {
                    assert.equal(d, respCtxt.domain);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

    it('should timeout in 1 second if give a timeout option of 1', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {});
        var before = Date.now();
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'], { timeout: 1 })
                .spread(function (body, options, respCtxt) {
                    var after = Date.now();
                    assert(after - before >= 1000);
                    assert(after - before < 2000);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

    it('should timeout faster than original timeout if given smaller timeout ', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {});
        var before = Date.now();
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'], { timeout: 0.1 })
                .spread(function (body, options, respCtxt) {
                    var after = Date.now();
                    assert(after - before < 1000);
                    done();
                })
                .catch(done);
        });
        d.send(['nice'], [], void 0, { timeout: 1.5});
    });

    it('should timeout faster than proxy timeout if original is smaller ', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {});
        var before = Date.now();
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'], { timeout: 1.5 })
                .spread(function (body, options, respCtxt) {
                    var after = Date.now();
                    assert(after - before < 1000);
                    done();
                })
                .catch(done);
        });
        d.send(['nice'], [], void 0, { timeout: 0.1});
    });

    it('should not timeout when given a timeout option of 0', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {});
        var before = Date.now();
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'], { timeout: 0 })
                .spread(function () {
                    done('unexpected return');
                })
                .catch(done);
        });
        d.send(['nice']);
        done();
    });

    it('should return unavailable statusCode 503 when no host matches', function (done) {
        d.mount(['nice'], function (body, ctxt) {
            ctxt.proxy(['lumberjack'])
                .spread(function (body, options, ctxt) {
                    assert.equal(503, options.statusCode);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

    it('should not leak request listeners', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            ctxt.send(ctxt.from, [], 'voyage');
        });
        d.mount(['nice'], function (body, ctxt) {
            var initialCount = d.listeners('**').length;
            ctxt.proxy(['lumberjack'])
                .spread(function () {
                    assert.equal(initialCount, d.listeners('**').length);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

    it('should not leak request listeners on timeout', function (done) {
        d.mount(['nice'], function (body, ctxt) {
            var initialCount = d.listeners('**').length;
            ctxt.proxy(['lumberjack'], { timeout: 0.001 })
                .spread(function () {
                    assert.equal(initialCount, d.listeners('**').length);
                    done();
                })
                .catch(done);
        });
        d.send(['nice']);
    });

});
