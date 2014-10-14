/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    describe('synchOption', function () {

        it('should ensure all descendants are called with the same object', function (done) {
            var dual = dualapi();
            var called = 0;
            dual.mount(['ebola'], {
                ':morality': [
                    dualapi.synchOption('morality', function (ctxt, cb) {
                        return cb(null, { suit: 0 });
                    })
                    , function (ctxt, next) {
                        process.nextTick(function () {
                            called++;
                            ctxt.options.morality.suit++;
                            if (called >= 2) {
                                assert.equal(2, ctxt.options.morality.suit);
                                done();
                            }
                            next();
                        });
                    }
                ]
            });
            dual.send(['ebola', 'fears']);
            dual.send(['ebola', 'fears']);
        });

        it('should ensure all descendants are called with different objects for different values of param', function (done) {
            var dual = dualapi();
            var called = 0;
            dual.mount(['ebola'], {
                ':morality': [
                    dualapi.synchOption('morality', function (ctxt, cb) {
                        return cb(null, { suit: 0 });
                    })
                    , function (ctxt, next) {
                        process.nextTick(function () {
                            called++;
                            if (called >= 2) {
                                assert.notEqual(2, ctxt.options.morality.suit);
                                done();
                            }
                            next();
                        });
                    }
                ]
            });
            dual.send(['ebola', 'fears']);
            dual.send(['ebola', 'isolate']);
        });

        it('should call fetch with expected ctxt', function (done) {
            var dual = dualapi();
            var called = 0;
            dual.mount(['ebola'], {
                ':morality': [
                    dualapi.synchOption('morality', function (ctxt, cb) {
                        assert.deepEqual(['ebola', 'fears'], ctxt.to);
                        assert.deepEqual(['day', 'at', 'school'], ctxt.from);
                        assert.deepEqual({ english: 'math'}, ctxt.body);
                        assert.deepEqual({ frankenstein: true}, ctxt.options);
                        done();
                    })
                ]
            });
            dual.send(['ebola', 'fears'], ['day', 'at', 'school'], { english: 'math'}, { frankenstein: true});
        });

        it('should cancel on error', function (done) {
            var dual = dualapi();
            var called = 0;
            dual.mount(['ebola'], {
                ':morality': [
                    dualapi.synchOption('morality', function (ctxt, cb) {
                        return cb(true);
                    })
                    , function () {
                        assert(false);
                    }
                ]
            });
            dual.send(['ebola', 'fears']).catch(function () {
                done();
            });
        });


    });



});
