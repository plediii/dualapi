/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi', function () {

    describe('context parameters', function () {
        
        it('should be able to mount host points with parameters', function (done) {
            var dual = dualapi();
            dual.mount(['cupcake', ':sprinkles'], function (ctxt) {
                assert.equal(ctxt.params.sprinkles, 'chocolate');
                done();
            });

            dual.send(['cupcake', 'chocolate']);
        });

        it('should be able to mount host points matching route tails', function (done) {
            var dual = dualapi();
            dual.mount(['resolve', '::who'], function (ctxt) {
                assert.deepEqual(ctxt.params.who, ['is', 'doing', 'the', 'dishes']);
                done();
            });

            dual.send(['resolve', 'frank', 'is', 'doing', 'the', 'dishes']);
        });
        
    });

});
