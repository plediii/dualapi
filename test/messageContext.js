/*jslint node: true */
/* global -Promise */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');

describe('dualapi', function () {

    
    describe('messageContext', function () {

        it('should provide defaults for each parameter', function () {
            var ctxt = new dualapi.MessageContext({});            
            assert.deepEqual(ctxt.to, []);
            assert.deepEqual(ctxt.from, []);
            assert.equal(ctxt.body, null);
            assert(_.isObject(ctxt.options));
        });

        it('should consist of only dual parameters in toJSON', function () {
            var ctxt = new dualapi.MessageContext({
                domain: { twenty: 'years'}
                , to: ['vice', 'president']
                , from: ['senate']
                , body: { maybe: 'house' }
                , options: { punching: 'bag' }
            });      
            var json = ctxt.toJSON();
            var jsonKeys = _.keys(json);
            assert.equal(4, jsonKeys.length);
            assert.deepEqual(json.to, ['vice', 'president']);
            assert.deepEqual(json.from, ['senate']);
            assert.equal(json.body.maybe, 'house');
            assert.equal(json.options.punching, 'bag');
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
                                assert.notEqual(options.beautiful, 'day');
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
                            assert.equal(options.addendum, 'ps');
                            done();
                        }
                    }
                    , from: ['bonjour']
                });
                ctxt.reply(null, {addendum: 'ps'});
            });

            it('should default to 200 status code', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body, options) {
                            assert.equal(options.statusCode, '200');
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
                            assert.equal(body.message, 'life');
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

        describe(' .send', function () {

            it('should alias domain.send ', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body, options) {
                            assert.deepEqual(to, ['the', 'curious']);
                            assert.deepEqual(from, ['case', 'of']);
                            assert.equal('jr', body.cleveland);
                            assert.equal('rock', options.kid);
                            done();
                        }
                    }
                });
                ctxt.send(['the', 'curious'], ['case', 'of'], { cleveland: 'jr' }, { kid: 'rock' });
            });

        });

        describe('.get', function () {

            it('should alias domain.get', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        get: function (to, body, options) {
                            assert.deepEqual(to, ['the', 'curious']);
                            assert.equal('jr', body.cleveland);
                            assert.equal('rock', options.kid);
                            done();
                        }
                    }
                });
                ctxt.get(['the', 'curious'], { cleveland: 'jr' }, { kid: 'rock' });
            });

        });

        describe('.request', function () {

            it('should alias domain.request', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        request: function (to, body, options) {
                            assert.deepEqual(to, ['the', 'curious']);
                            assert.equal('jr', body.cleveland);
                            assert.equal('rock', options.kid);
                            done();
                        }
                    }
                });
                ctxt.request(['the', 'curious'], { cleveland: 'jr' }, { kid: 'rock' });
            });

        });

        describe('.proxy', function () {

            var dual;
            beforeEach(function () {
                dual = dualapi();
            });

            it('should create new get request to provided destination', function (done) {
                dual.mount({
                    happy: function (ctxt) {
                        return ctxt.reply('new year');
                    }
                    , mudumbo: function (ctxt) {
                        return ctxt.proxy(['happy'])
                            .then(function (proxyctxt) {
                                ctxt.reply(proxyctxt.body);
                            })
                            .catch(done);
                    }
                });
                dual.get(['mudumbo'])
                    .then(function (ctxt) {
                        assert.equal('new year', ctxt.body);
                        done();
                    })
                    .catch(done);
            });

            it('should transmit existing options', function (done) {
                dual.mount({
                    happy: function (ctxt) {
                        assert.equal('daily', ctxt.body.tine);
                        done();
                    }
                    , mudumbo: function (ctxt) {
                        return ctxt.proxy(['happy']);
                    }
                });
                dual.get(['mudumbo'], { tine: 'daily' });
            });

            it('should be able to override existing options', function (done) {
                dual.mount({
                    happy: function (ctxt) {
                        assert.equal('business', ctxt.options.tine);
                        done();
                    }
                    , mudumbo: function (ctxt) {
                        ctxt.proxy(['happy'], { tine: 'business' });
                    }
                });
                dual.get(['mudumbo'], { tine: 'daily' });
            });

        });

        describe('.replyPromise', function () {

            var dual;
            beforeEach(function () {
                dual = dualapi();
            });

            it('should reply with resolved as body by default', function (done) {
                dual.mount({
                    playing: function (ctxt) {
                        return ctxt.replyPromise(Promise.resolve('long'));
                    }
                });
                dual.get(['playing'])
                .then(function (ctxt) {
                    assert.equal(ctxt.body, 'long');
                    done();
                })
                .catch(done);
            });

            it('should reply with reject as body by default', function (done) {
                dual.mount({
                    playing: function (ctxt) {
                        return ctxt.replyPromise(Promise.reject('wing'));
                    }
                });
                dual.get(['playing'])
                .then(function (ctxt) {
                    assert.equal(ctxt.body, 'wing');
                    done();
                })
                .catch(done);
            });

            it('should reply success status code when resolved by default', function (done) {
                dual.mount({
                    playing: function (ctxt) {
                        return ctxt.replyPromise(Promise.resolve('long'));
                    }
                });
                dual.get(['playing'])
                    .then(function (ctxt) {
                        assert.equal(ctxt.options.statusCode, '200');
                        done();
                    })
                    .catch(done);
            });

            it('should reply internal error status code when rejected by default', function (done) {
                dual.mount({
                    playing: function (ctxt) {
                        return ctxt.replyPromise(Promise.reject('long'));
                    }
                });
                dual.get(['playing'])
                    .then(function (ctxt) {
                        assert.equal(ctxt.options.statusCode, '500');
                        done();
                    })
                    .catch(done);
            });

            it('should reply with resolved.body when available', function (done) {
                dual.mount({
                    playing: function (ctxt) {
                        return ctxt.replyPromise(Promise.resolve({ message: 'ring' }));
                    }
                });
                dual.get(['playing'])
                    .then(function (ctxt) {
                        assert.equal(ctxt.body, 'ring');
                        done();
                    })
                    .catch(done);
            });

            it('should reply resolved.statusCode when available', function (done) {
                dual.mount({
                    playing: function (ctxt) {
                        return ctxt.replyPromise(Promise.resolve({ 
                            message: 'ring'
                            , statusCode: '420'
                        }));
                    }
                });
                dual.get(['playing'])
                    .then(function (ctxt) {
                        assert.equal(ctxt.options.statusCode, '420');
                        done();
                    })
                    .catch(done);
            });

        });

        describe('.parent', function (ctxt) {

            it('should return the route up to destination', function () {
                var ctxt = new dualapi.MessageContext({
                    to: ['play', 'him', 'off']
                });
                assert.deepEqual(ctxt.parent(), ['play', 'him']);
            });

            it('should return the parent parent when given 2', function () {
                var ctxt = new dualapi.MessageContext({
                    to: ['play', 'him', 'off']
                });
                assert.deepEqual(ctxt.parent(2), ['play']);
            });

            it('should throw exception when given parent depth greater than destination', function () {
                var ctxt = new dualapi.MessageContext({
                    to: ['play', 'him', 'off']
                });
                assert.throws(function () {
                    ctxt.parent(4);
                });
            });

        });

    });

});
