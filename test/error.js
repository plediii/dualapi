/*jslint node: true */
/* global -Promise */
"use strict";

var dualapi = require('../index');
var _ = require('lodash');
var assert = require('assert');
var Promise = require('bluebird');

describe('dualapi', function () {

    describe('error', function () {

        var d;
        beforeEach(function (done) {
            d = dualapi();
            done();
        });

        _.each({
            'synch host throws': function (ctxt) {
                throw 'battery';
            }
            , 'synch host rejects': function (ctxt) {
                return Promise.reject('battery');
            }
            , 'no arg host throws': function () {
                throw 'battery';
            }
            , 'no arg host rejects': function () {
                return Promise.reject('battery');
            }
            , 'asynch host throws': function (ctxt, done) {
                return Promise.reject('battery');
            }
            , 'asynch host rejects': function (ctxt, done) {
                return Promise.reject('battery');
            }
            , 'parametrized synch host throws': { 
                '::city': function (ctxt) {
                    throw 'battery';
                }
            }
            , 'parametrized synch host rejects': { 
                '::city': function (ctxt) {
                    return Promise.reject('battery');
                }
            }
            , 'parametrized no arg host throws': {
                '::city': function () {
                    throw 'battery';
                }
            }
            , 'parametrized no arg host rejects': { 
                '::city': function () {
                    return Promise.reject('battery');
                }
            }
            , 'parametrized asynch host throws': {
                '::city': function (ctxt, done) {
                    return Promise.reject('battery');
                }
            }
            , 'parametrized asynch host rejects': {
                '::city': function (ctxt, done) {
                    return Promise.reject('battery');
                }
            }
        }, function (thrower, name) {
            describe(name, function () {

                it('should be triggered when a host function throws an error', function (done) {
                    d.mount(['error'], function (ctxt) {
                        done();
                    });
                    d.mount(['thrower'], thrower);
                    d.send(['thrower']);
                });


                it('should be triggered with the exception as body.error', function (done) {
                    d.mount(['error'], function (ctxt) {
                        assert.equal('battery', ctxt.body.error);
                        done();
                    });
                    d.mount(['thrower'], thrower);
                    d.send(['thrower']);
                });

                it('should be triggered with the destination as error subroute', function (done) {
                    d.mount(['error', 'thrower'], function (ctxt) {
                        done();
                    });
                    d.mount(['thrower'], thrower);
                    d.send(['thrower']);
                });

                it('should be triggered with the original context as body.context', function (done) {
                    d.mount(['error'], function (ctxt) {
                        assert(_.isEqual(ctxt.body.context.to, ['thrower']));
                        assert(_.isEqual(ctxt.body.context.from, ['changing']));
                        assert.equal('night', ctxt.body.context.body.sleep);
                        assert.equal('sun', ctxt.body.context.options.people);
                        done();
                    });
                    d.mount(['thrower'], thrower);
                    d.send(['thrower'], ['changing'], { sleep: 'night'}, { people: 'sun' });
                });

            });
        });

        it('should not cause an infinite sequence of errors', function (done) {
            d.mount(['error'], function () {
                throw 'fail';
            });
            d.mount(['throwsError'], function () {
                throw 'test';
            });
            d.mount(['done'], function () {
                console.log('done...');
                done();
            });
            d.send(['throwsError']);
            d.send(['done']);
        });

    });

});
