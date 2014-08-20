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
                dual.mount(['voiture6', 'rouge'], function () {
                    assert(false);
                });
                dual.mount(['voiture6', '*'], function () {
                    called++;
                    if (called > 1) {
                        done();
                    }
                });
                dual.open(['rue3'], {
                    on: function (target, cb) {
                        if (target === 'dual') {
                            cb({ to: ['voiture6', 'red']});
                            cb({ to: ['voiture6', 'rouge']});
                            cb({ to: ['voiture6', 'blue']});
                        }
                    }
                }, function (ctxt, pass) {
                    return pass(ctxt.to[1] !== 'rouge');
                }); 
            });

            it('ctxt should be private to the firewall', function (done) {

                dual.mount(['voiture7', '*'], function (ctxt) {
                    assert.equal(ctxt.to[1], 'rouge');
                    done();
                });
                dual.open(['rue20'], {
                    on: function (target, cb) {
                        if (target === 'dual') {
                            cb({ to: ['voiture7', 'rouge']});
                        }
                    }
                }, function (ctxt, pass) {
                    ctxt.to[1] = 'blue';
                    return pass(true);
                }); 
            });

        });

        describe('receive', function () {

            it('dual should transfer messages targeted to the mount point on "dual" channel', function (done) {

                dual.open(['wormhole'], {
                    on: function (target, cb) {}
                    , emit: function (target) {
                        assert.equal(target, 'dual');
                        done();
                    }
                });                
                dual.send(['wormhole']);

            });


            it('dual should transfer messages targeted below the mount point on "dual" channel', function (done) {

                dual.open(['wormhole1'], {
                    on: function (target, cb) {}
                    , emit: function (target) {
                        assert.equal(target, 'dual');
                        done();
                    }
                });                
                dual.send(['wormhole1', 'delta']);
            });

            it('dual should transfer the json context, preserving from field', function (done) {

                dual.open(['wormhole2'], {
                    on: function (target, cb) {}
                    , emit: function (target, msg) {
                        assert.deepEqual(msg.from, ['bajor']);
                        done();
                    }
                });                
                dual.send(['wormhole2', 'delta'], ['bajor']);
            });

            it('dual should transfer the json context, preserving body field', function (done) {

                dual.open(['wormhole3'], {
                    on: function (target, cb) {}
                    , emit: function (target, msg) {
                        assert.deepEqual(msg.body, {captain: 'sisko'});
                        done();
                    }
                });                
                dual.send(['wormhole3', 'delta'], ['bajor'], { captain: 'sisko'});
            });

            it('dual should transfer the json context, translating the to field', function (done) {

                dual.open(['wormhole4'], {
                    on: function (target, cb) {}
                    , emit: function (target, msg) {
                        assert.deepEqual(msg.to, ['delta']);
                        done();
                    }
                });                
                dual.send(['wormhole4', 'delta'], { captain: 'sisko'});
            });
            
        });

        describe('disconnect', function () {

            it('dual should stop sending messages to the mounted host after disconnect', function (done) {
                var mockSocket = {};
                var called = 0;
                dual.mount(['sector'], function () {
                    called++;
                });
                dual.open(['deepspace'], {
                    on: function (target, cb) {
                        mockSocket[target] = cb;
                    }
                    , off: function () {}
                    , emit: function () {
                        called++;
                        assert.equal(called, 1);
                        mockSocket.disconnect();
                        dual.send(['deepspace']);
                        done();
                    }
                }); 
                dual.send(['deepspace']);
            });

            it('dual should stop sending messages below the mounted host after disconnect', function (done) {
                var mockSocket = {};
                var called = 0;
                dual.mount(['sector2'], function () {
                    called++;
                });
                dual.open(['deepspace2'], {
                    on: function (target, cb) {
                        mockSocket[target] = cb;
                    }
                    , off: function () {}
                    , emit: function () {
                        called++;
                        assert.equal(called, 1);
                        mockSocket.disconnect();
                        dual.send(['deepspace2', '2']);
                        done();
                    }
                }); 
                dual.send(['deepspace2', '1']);
            });


            it('dual should stop listening for dual messages on disconnect', function (done) {
                var mockSocket = {};
                dual.open(['deepspace3'], {
                    on: function (target, cb) {
                        mockSocket[target] = cb;
                    }
                    , off: function (target, cb) {
                        if (target == 'dual') {
                            done();
                        }
                    }
                }); 
                mockSocket.disconnect();
            });

            it('dual should stop listening for disconnect messages on disconnect', function (done) {
                var mockSocket = {};
                dual.open(['deepspace3'], {
                    on: function (target, cb) {
                        mockSocket[target] = cb;
                    }
                    , off: function (target, cb) {
                        if (target == 'disconnect') {
                            done();
                        }
                    }
                }); 
                mockSocket.disconnect();
            });

        });

    });

});
