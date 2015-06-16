/*jslint node: true */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('dual-protocol');


describe('return', function () {

    var d;
    beforeEach(function () {
        d = dualproto.use(require('../src/forward'))();
    });

    it('should be provided on Message', function (done) {
        d.mount(['nice'], function (body, ctxt) {
            assert(_.isFunction(ctxt.forward));
            done();
        });
        d.send(['nice']);
    });

    it('should send a message to first argument', function (done) {
        d.mount(['lumberjack'], function () {
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.forward(['lumberjack']);
        });
        d.send(['nice']);
    });

    it('should send a message with original body', function (done) {
        d.mount(['lumberjack'], function (body) {
            assert.deepEqual({ interpol: 'feds'}, body);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.forward(['lumberjack']);
        });
        d.send(['nice'], [], { interpol: 'feds' });
    });

    it('should send a message with original options', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            assert.deepEqual({ music: 'am' }, ctxt.options);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.forward(['lumberjack']);
        });
        d.send(['nice'], [], { interpol: 'feds' }, { music: 'am' });
    });

    it('should send a message with second argument as options extensions', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            assert.equal('it', ctxt.options.see);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.forward(['lumberjack'], { see: 'it'});
        });
        d.send(['nice'], [], { interpol: 'feds' }, { music: 'am' });
    });

    it('should send a message with second argument as options overrides', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            assert.equal('fm', ctxt.options.music);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.forward(['lumberjack'], { music: 'fm'});
        });
        d.send(['nice'], [], { interpol: 'feds' }, { music: 'am' });
    });

    it('should not mutate original options', function (done) {
        var options = { music: 'am' };
        d.mount(['lumberjack'], function (body, ctxt) {
            assert.deepEqual({ music: 'am' }, options);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.forward(['lumberjack'], { music: 'fm'});
        });
        d.send(['nice'], [], { interpol: 'feds' }, options);
    });

    it('should send with original from address', function (done) {
        d.mount(['lumberjack'], function (body, ctxt) {
            assert.deepEqual(['addict'], ctxt.from);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.forward(['lumberjack']);
        });
        d.send(['nice'], ['addict'], { interpol: 'feds' });
    });

});
