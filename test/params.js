/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualapi', function () {

    describe('context parameters', function () {

        var dual = dualapi();
        
        it('should be host mount points', function (done) {
            dual.mount(['cupcake', ':sprinkles'], function (ctxt) {
                assert.equal(ctxt.params.sprinkles, 'chocolate');
                done();
            });

            dual.send(['cupcake', 'chocolate']);
        });
        
    });

});
