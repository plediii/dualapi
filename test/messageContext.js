/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

describe('dualapi', function () {

    
    describe('messageContext', function () {

        it('should provide defaults for each parameter', function () {
            var ctxt = new dualapi.MessageContext({});            
            assert.deepEqual(ctxt.to, []);
            assert.deepEqual(ctxt.from, []);
            assert.equal(ctxt.body, null);
            assert.deepEqual(ctxt.options, {});
        });
        
        describe('.reply', function () {

            it('should send the argument to the message from host', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(to, ['deep', 'space', 'nine']);
                            done();
                        }
                    }
                    , from: ['deep', 'space', 'nine']
                });
                ctxt.reply();
            });


            it('should send with argument as body', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(body, { ferengi: 'attack'});
                            done();
                        }
                    }
                    , from: ['drain']
                });
                ctxt.reply({ ferengi: 'attack'});
            });

            it('should *not* include options', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body, options) {
                            if (options) {
                                assert.deepEqual(options, {});
                            }
                            done();
                        }
                    }
                    , from: ['got', 'got', 'got']
                    , options: {beautiful: 'day'}
                });
                ctxt.reply();
            });

            it('should allow providing options', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body, options) {
                            assert.deepEqual(options, {addendum: 'ps'});
                            done();
                        }
                    }
                    , from: ['bonjour']
                });
                ctxt.reply(null, {addendum: 'ps'});
            });


        });

        describe('.forward', function () {

            it('should send to provided "to"', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(to, ['deep', 'space', 'ten']);
                            done();
                        }
                    }
                    , to: ['deep', 'space', 'twenty']
                    , from: ['starship', 'enterprise']
                });
                ctxt.forward(['deep', 'space', 'ten']);
            });

            it('should send with original "from" field', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(from, ['starship', 'enterprise']);
                            done();
                        }
                    }
                    , to: ['deep', 'space', 'twenty']
                    , from: ['starship', 'enterprise']
                });
                ctxt.forward(['deep', 'space', 'ten']);
            });

            it('should send with original "body" field', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(from, ['starship', 'enterprise']);
                            done();
                        }
                    }
                    , to: ['deep', 'space', 'twenty']
                    , from: ['starship', 'enterprise']
                    , body: { borg: 'invasion'}
                });
                ctxt.forward(['deep', 'space', 'ten']);
            });

            it('should send with original options field', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body, options) {
                            assert(options);
                            assert.equal(options.deep, 'space');
                            done();
                        }
                    }
                    , to: ['deep', 'deeper', 'deepest']
                    , from: ['something']
                    , options: {deep: 'space'}
                });
                ctxt.forward(['monkey']);
            });

            it('should send with original additional options field', function (done) {

                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body, options) {
                            assert(options);
                            assert.equal(options.deep, 'space');
                            assert.equal(options.something, 'completely');
                            done();
                        }
                    }
                    , to: ['deep', 'deeper', 'deepest']
                    , from: ['something']
                    , options: {deep: 'space'}
                });
                ctxt.forward(['monkey'], {something: 'completely'});
            });

            it('should send with overriden options field', function (done) {

                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body, options) {
                            assert(options);
                            assert.equal(options.deep, 'different');
                            done();
                        }
                    }
                    , to: ['deep', 'deeper', 'deepest']
                    , from: ['something']
                    , options: {deep: 'space'}
                });
                ctxt.forward(['monkey'], {deep: 'different'});
            });

        });

        describe('.transfer', function () {

            it('should emit on socket with expected parameters', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {}
                    , to: ['big', 'on', 'ready']
                    , from: ['part', 'missed']
                    , body: { oh: 'gauntlet'}
                    , options: { torches: 'cool' }
                });
                var socket = new EventEmitter();
                socket.on('dual', function (msg) {
                    assert.deepEqual(msg.to, ['on', 'ready']);
                    assert.deepEqual(msg.from, ['part', 'missed']);
                    assert.deepEqual(msg.body, { oh: 'gauntlet'});
                    assert.deepEqual(msg.options, { torches: 'cool' });
                    done();
                });
                ctxt.transfer(['big'], socket);
            });

            it('should emit on socket with additional options', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {}
                    , to: ['big', 'on', 'ready']
                    , from: ['part', 'missed']
                    , body: { oh: 'gauntlet'}
                    , options: { torches: 'cool' }
                });
                var socket = new EventEmitter();
                socket.on('dual', function (msg) {
                    assert.deepEqual(msg.options,{ 
                            torches: 'cool' 
                            , your: 'way'
                    });
                    done();
                });
                ctxt.transfer(['big'], socket, {
                    your: 'way'
                });
            });

            it('should emit on socket with overriden options', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {}
                    , to: ['big', 'on', 'ready']
                    , from: ['part', 'missed']
                    , body: { oh: 'gauntlet'}
                    , options: { torches: 'cool' }
                });
                var socket = new EventEmitter();
                socket.on('dual', function (msg) {
                    assert.deepEqual(msg.options,{ 
                            torches: 'bad' 
                    });
                    done();
                });
                ctxt.transfer(['big'], socket, {
                    torches: 'bad'
                });
            });

        });

        describe('.error', function () {

            it('should send to error++to', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(['error', 'haha'], to);
                            done();
                        }
                    }
                    , to: ['haha']
                });
                ctxt.error();
            });

            it('should send with body having error message', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.equal(body.message, 'life')
                            done();
                        }
                    }
                });
                ctxt.error('life');
            });

            it('should send with body having original context.to', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(body.ctxt.to, ['survive', 'volcano']);
                            done();
                        }
                    }
                    , to: ['survive', 'volcano']
                });
                ctxt.error();
            });

            it('should send with body having original context.from', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(body.ctxt.from, ['casting', 'by']);
                            done();
                        }
                    }
                    , from: ['casting', 'by']
                });
                ctxt.error();
            });

            it('should send with body having original context.body', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(body.ctxt.body, 'beautiful');
                            done();
                        }
                    }
                    , body: 'beautiful'
                });
                ctxt.error();
            });

            it('should send with body having original context.options', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(body.ctxt.options, { your: 'sweater'});
                            done();
                        }
                    }
                    , options: { your: 'sweater' }
                });
                ctxt.error();
            });


        });

    });

});
