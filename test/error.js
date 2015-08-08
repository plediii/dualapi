/*jslint node: true */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('dual-protocol');


describe('error', function () {

    var d;
    beforeEach(function () {
        d = dualproto.use(require('../src/error'))();
    });

    it('should be available on the message context', function (done) {
        d.mount(['nice'], function (body, ctxt) {
            assert(_.isFunction(ctxt.error));
            done();
        });
        d.send(['nice']);
    });

    it('should send a message with unsendable address', function (done) {
        d.mount(['error', 'nice'], function (body, ctxt) {
            assert.throws(function () {
                ctxt.send(ctxt.from);
            });
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error();
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message to the error/to address', function (done) {
        d.mount(['error', 'nice'], function (body, ctxt) {
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error();
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message with original ctxt as body.ctxt', function (done) {
        d.mount(['error', 'nice'], function (body) {
            assert.deepEqual(['nice'], body.ctxt.to);
            assert.deepEqual(['human'], body.ctxt.from);
            assert.deepEqual({ been: 'happy' }, body.ctxt.body);
            assert.deepEqual({ selling: 'point' }, body.ctxt.options);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error();
        });
        d.send({
            to: ['nice']
            , from: ['human']
            , body: { been: 'happy' }
            , options: { selling: 'point' }
        });
    });

    it('should send first argument as body', function (done) {
        d.mount(['error', 'nice'], function (body) {
            assert(body instanceof Error);
            assert.equal(body.message, 'feedback');
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error(new Error('feedback'));
        });
        d.send({
            to: ['nice']
            , from: ['human']
            , body: { been: 'happy' }
            , options: { selling: 'point' }
        });
    });

    it('should send accept non-object error', function (done) {
        d.mount(['error', 'nice'], function (body) {
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error(10);
        });
        d.send({
            to: ['nice']
            , from: ['human']
            , body: { been: 'happy' }
            , options: { selling: 'point' }
        });
    });

    it('should accept undefined error body', function (done) {
        d.mount(['error', 'nice'], function (body) {
            assert(body instanceof Error);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error();
        });
        d.send({
            to: ['nice']
            , from: ['human']
            , body: { been: 'happy' }
            , options: { selling: 'point' }
        });
    });

    it('should produce message for undefined error', function (done) {
        d.mount(['error', 'nice'], function (body) {
            assert(body.hasOwnProperty('message'));
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error();
        });
        d.send({
            to: ['nice']
            , from: ['human']
            , body: { been: 'happy' }
            , options: { selling: 'point' }
        });
    });

    it('should convert non-object error to message', function (done) {
        d.mount(['error', 'nice'], function (body) {
            assert(body instanceof Error);
            assert.equal(body.message, 10);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error(10);
        });
        d.send({
            to: ['nice']
            , from: ['human']
            , body: { been: 'happy' }
            , options: { selling: 'point' }
        });
    });

    it('should send a message with second argument as options', function (done) {
        d.mount(['error', 'nice'], function (body, ctxt) {
            assert.deepEqual({ jealous: 'liam' }, ctxt.options);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.error(null, { jealous: 'liam' });
        });
        d.send(['nice'], ['human']);
    });
});
