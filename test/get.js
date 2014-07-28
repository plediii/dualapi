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

    });

});
