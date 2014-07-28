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
                            assert.deepEqual(body, { ferengi: 'attack'});
                            done();
                        }
                    }
                    , from: ['deep', 'space', 'nine']
                });
                ctxt.reply({ferengi: 'attack'});
            });

        });

        describe('.forward', function () {

            it('should send the argument to the message from host, preserving the from and body fields', function (done) {
                var ctxt = new dualapi.MessageContext({
                    domain: {
                        send: function (to, from, body) {
                            assert.deepEqual(from, ['starship', 'enterprise']);
                            assert.deepEqual(to, ['deep', 'space', 'ten']);
                            assert.deepEqual(body, { borg: 'invasion'});
                            done();
                        }
                    }
                    , to: ['deep', 'space', 'twenty']
                    , from: ['starship', 'enterprise']
                    , body: { borg: 'invasion'}
                });
                ctxt.forward(['deep', 'space', 'ten']);
            });

        });

    });

});
