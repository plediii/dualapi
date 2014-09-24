/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('messageContext', function () {
        
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
                            assert(!options);
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

    });

});
