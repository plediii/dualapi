/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi', function () {
    
    describe('waitfor', function () {

        var dual;
        beforeEach(function () {
            dual = dualapi();
        });

        it('should resolve when target route emitted', function (done) {
            dual.waitFor(['lockersearch'])
            .then(function () {
                done();
            })
            .catch(function (err) {
                done(err || 'waitFor rejected');
            });
            dual.send(['lockersearch']);
        });

        it('should not leak listeners when resolved', function (done) {
            var initial = dual.listeners('**').length;
            dual.waitFor(['lockersearch'])
            .then(function () {
                assert.equal(initial, dual.listeners('**').length);
                done();
            })
            .catch(function (err) {
                done(err || 'waitFor rejected');
            });
            dual.send(['lockersearch']);
        });


        it('should reject after timeout interval when given timeout option (100)', function (done) {
            var start = Date.now();
            dual.waitFor(['lockersearch'], { timeout: 0.100 })
            .catch(function (err) {
                if (err) {
                    return done(err);
                }
                var delta = Date.now() - start;
                assert(delta >= 100);
                assert(delta < 200);
                done();
            });
        });

        it('should reject after timeout interval when given timeout option (200)', function (done) {
            var start = Date.now();
            dual.waitFor(['lockersearch'], { timeout: 0.200 })
            .catch(function (err) {
                var delta = Date.now() - start;
                assert(delta >= 200);
                assert(delta < 300);
                done();
            });
        });

        it('should not leak listeners when timed out', function (done) {
            var initial = dual.listeners('**').length;
            dual.waitFor(['lockersearch'], { timeout: 0.100 })
            .catch(function (err) {
                assert.equal(initial, dual.listeners('**').length);
                done();
            });
        });

        it('should resolve with dual context', function (done) {
            dual.waitFor(['hi'])
            .then(function (ctxt) {
                assert.deepEqual(ctxt.to, ['hi']);
                assert.deepEqual(ctxt.from, ['owner']);
                assert.equal(ctxt.body.recreational, 'vehicle');
                assert.equal(ctxt.options.yo, 'appointment');
                assert(_.isFunction(ctxt.get));
                done();
            })
            .catch(function (err) {
                done(err || 'waitfor reject');
            });
            dual.send(['hi'], ['owner'], { recreational: 'vehicle'}, { yo: 'appointment'});
        });

    });

});
