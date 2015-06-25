/*jslint node: true */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualapi = require('../index');


describe('dualapi', function () {

    var d;
    beforeEach(function () {
        d = dualapi();
    });

    describe('smoke test', function () {

        it('should be constructable', function () {
            assert(d);
        });

    });
    
    describe('domain attributes', function () {

    
        it('should have request', function () {
            assert(_.isFunction(d.request));
        });

    });

    describe('domain attributes', function () {

        
        var m;
        beforeEach(function (done) {
            d.mount(['toot'], function (body, ctxt) {
                m = ctxt;
                done();
            });
            d.send(['toot']);
        });

    
        it('should have request', function () {
            assert(_.isFunction(m.request));
        });

        it('should have forward', function () {
            assert(_.isFunction(m.forward));
        });

        it('should have return', function () {
            assert(_.isFunction(m.return));
        });

        it('should have proxy', function () {
            assert(_.isFunction(m.proxy));
        });

    });

    describe('recycle dependencies', function () {
        
        it('should expose lodash', function () {
            assert(dualapi._);
        });

        it('should expose bluebird', function () {
            assert(dualapi.Promise);
        });


    });

});
