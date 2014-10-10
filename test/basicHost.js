/*jslint node: true */
"use strict";

var dualapi = require('../index');
var _ = require('underscore');
var assert = require('assert');

describe('dualapi', function () {

    
    describe('mounted host', function () {

        var dual = dualapi();
        
        it('should be triggered on target message', function (done) {
            dual.mount(['host'], function () {
                done();
            });

            dual.send(['host']);
        });

        it('should be triggered with destination field in context', function (done) {
            dual.mount(['hostA'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['hostA']);
                done();
            });

            dual.send(['hostA']);
        });

        it('should be triggered with from field', function (done) {
            dual.mount(['hostB'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['sourceA']);
                done();
            });
            dual.send(['hostB'], ['sourceA']);
        });

        it('should be triggered with undefined body when on body is provided', function (done) {
            dual.mount(['hostC'], function (ctxt) {
                assert(_.isUndefined(ctxt.body));
                done();
            });

            dual.send(['hostC'], ['sourceB']);
        });

        it('should be triggered with source body when one is provided', function (done) {
            dual.mount(['hostD'], function (ctxt) {
                assert.deepEqual(ctxt.body, {a: 1});
                done();
            });

            dual.send(['hostD'], [], {a: 1});
        });

        it('should NOT be triggered on target message for other hosts', function (done) {
            var received = 0;
            dual.mount(['hostE'], function () {
                received++;
            });
            dual.mount(['host1'], function () {
                assert.equal(received, 0);
                received++;
                done();
            });

            dual.send(['host1']);
        });

    });

    describe('mounted tree', function () {

        var dual = dualapi();

        it('should be possible to mount hosts in a tree structure', function (done) {
            dual.mount([], {
                host: function () {
                    done();
                }
            });

            dual.send(['host']);
        });

        it('should be possible to mount host trees directly', function (done) {
            dual.mount({
                go: function () {
                    done();
                }
            });

            dual.send(['go']);
        });


        it('should be possible to mount hosts in a tree structure below a static trunk', function (done) {
            dual.mount(['cookie'], {
                sword: function () {
                    done();
                }
            });

            dual.send(['cookie', 'sword']);
        });

        it('should be possible to mount deep tree structure', function (done) {
            dual.mount([], {
                treat: {
                    grass: function () {
                        done();
                    }
                }
            });

            dual.send(['treat', 'grass']);
        });

        it('should be possible to mount deep tree structure under a static root', function (done) {
            dual.mount(['phew'], {
                come: {
                    around: function () {
                        done();
                    }
                }
            });

            dual.send(['phew', 'come', 'around']);
        });

        it('should be possible to mount multiple deep tree structure', function (done) {
            var called = [];
            dual.mount([], {
                huh: {
                    pizza: function () {
                        called.push('pizza');
                    }
                }
                , no: {
                    more: function () {
                        assert.deepEqual(called, ['pizza']);
                        done();
                    }
                }
            });

            dual.send(['huh', 'pizza']);
            dual.send(['no', 'more']);
        });

        it('should be possible to mount array', function (done) {
            var called = [];
            dual.mount(['yeah'], [
                function () {
                    called.push('dragon');
                }
                , function () {
                    called.push('drag-on');
                }
            ]);

            dual.send(['yeah']).then(function () {
                assert.deepEqual(['dragon', 'drag-on'], called);
                done();
            });
        });

        it('should be possible to mount nested array', function (done) {
            var called = [];
            dual.mount([], {
                juicy: {
                    apple:[
                        function () {
                            called.push('no');
                        }
                        , function () {
                            called.push('acceptable');
                        }
                    ]
                }
            });

            dual.send(['juicy', 'apple']).then(function () {
                assert.deepEqual(['no', 'acceptable'], called);
                done();
            });
        });

    });

});
