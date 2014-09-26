/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('get', function () {

        var dual = dualapi();

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
                assert.deepEqual(ctxt.options, { corridor: 'thousand' })
                done();
            });
            dual.get(['scream'], null, { corridor: 'thousand' });
        });

    });

});
