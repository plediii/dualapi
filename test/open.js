/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('open', function () {

        var dual = dualapi();

        describe('send', function () {

            it('should listen for dual messages on the socket', function (done) {
                dual.open(['rue'], {
                    on: function (target, cb) {
                        if (target == 'dual') {
                            done();
                        }
                    }
                });
            });

            it('should listen for disconnect messages on the socket', function (done) {
                dual.open(['rue2'], {
                    on: function (target, cb) {
                        if (target == 'disconnect') {
                            done();
                        }
                    }
                });
            });

            it('should echo dual messages to the domain with the destination', function (done) {
                dual.mount(['voiture'], function () {
                    done();
                });
                dual.open(['rue3'], {
                    on: function (target, cb) {
                        if (target === 'dual') {
                            cb({
                                to: ['voiture']
                            });
                        }
                    }
                });
            });

            it('should echo dual messages to the domain preserving body', function (done) {
                dual.mount(['voiture2'], function (ctxt) {
                    assert.deepEqual(ctxt.body, {prendre: 'gauche'});
                    done();
                });
                dual.open(['rue3'], {
                    on: function (target, cb) {
                        if (target === 'dual') {
                            cb({
                                to: ['voiture2']
                                , body: {prendre: 'gauche'}
                            });
                        }
                    }
                });
            });

            it('should translate the from field', function (done) {
                dual.mount(['voiture3'], function (ctxt) {
                    assert.deepEqual(ctxt.from, ['rue4', 'amerique']);
                    done();
                });
                dual.open(['rue4'], {
                    on: function (target, cb) {
                        if (target === 'dual') {
                            cb({
                                to: ['voiture3']
                                , from: ['amerique']
                            });
                        }
                    }
                });
            });

        });

        describe('firewall', function () {
            
            it('should be able to filter messages', function (done) {
                var called = 0;
                dual.mount(['voiture6', '*'], function () {
                    called++;
                });
                dual.open(['rue3'], {
                    on: function (target, cb) {
                        if (target === 'dual') {
                            cb({ to: ['voiture6', 'red']});
                            cb({ to: ['voiture6', 'rouge']});
                            assert.equal(called, 1);
                            done();
                        }
                    }
                }, function (ctxt, pass) {
                    return pass(ctxt.to[1] === 'rouge');
                }); 
            });
        });

    });

});
