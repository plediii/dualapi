/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('bridge', function () {

        it('should transfer events from bridged host to target host', function (done) {

            var d = dualapi();
            var e = dualapi();

            e.mount(['yours'], function () {
                done();
            });
            d.bridge(e, [['yours']]);
            d.send(['yours'], [], {}, {});
        });

        it('should transfer deep events from bridged host to target host', function (done) {

            var d = dualapi();
            var e = dualapi();

            e.mount(['yours', 'oasis'], function () {
                done();
            });
            d.bridge(e, [['yours']]);
            d.send(['yours', 'oasis'], [], {}, {});
        });

        it('should transfer events with identical from host', function (done) {

            var d = dualapi();
            var e = dualapi();

            e.mount(['yours'], function (ctxt) {
                assert.deepEqual(['carol'], ctxt.from);
                done();
            });
            d.bridge(e, [['yours']]);
            d.send(['yours'], ['carol'], {}, {});
        });

        it('should transfer events with identical body', function (done) {
            var d = dualapi();
            var e = dualapi();

            e.mount(['yours'], function (ctxt) {
                assert.deepEqual({lizzy: 'here'}, ctxt.body);
                done();
            });
            d.bridge(e, [['yours']]);
            d.send(['yours'], [], {lizzy: 'here'}, {});
        });

        it('should transfer events with identical options', function (done) {
            var d = dualapi();
            var e = dualapi();

            e.mount(['yours'], function (ctxt) {
                assert.deepEqual({lizzy: 'here'}, ctxt.options);
                done();
            });
            d.bridge(e, [['yours']]);
            d.send(['yours'], [], {}, {lizzy: 'here'});
        });

        it('should transfer "from" events from target host to  bridged host', function (done) {

            var d = dualapi();
            var e = dualapi();

            e.mount(['yours'], function () {
                done();
            });
            e.bridge(d, [], [['yours']]);
            d.send(['yours'], [], {}, {});
        });

    });

});
