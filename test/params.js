/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    describe('context parameters', function () {

        var dual = dualapi();
        
        it('should be host mount points', function () {
            dual.mount(['cupcake', ':sprinkles'], function (ctxt) {
                assert.equal(ctxt.params.sprinkles, 'chocolate');
            });

            dual.send(['cupcake', 'chocolate']);
        });
        
    });

});
