/*jslint node: true */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('dual-protocol');


describe('return', function () {

    var d;
    beforeEach(function () {
        d = dualproto.use(require('../src/return'))();
    });

    it('should be available on the message context', function (done) {
        d.mount(['nice'], function (body, ctxt) {
            assert(_.isFunction(ctxt.return));
            done();
        });
        d.send(['nice']);
    });

    it('should send a message with unsendable address', function (done) {
        var sendCount = 0;
        d.mount(['**'], function (body, ctxt) {
            sendCount++;
            if (sendCount > 2) {
                done('Unexpected send: ' + JSON.stringify(ctxt));
            }
        });
        d.mount(['human'], function (body, ctxt) {
            ctxt.send(ctxt.from);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return();
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message to the from address', function (done) {
        d.mount(['human'], function (body, ctxt) {
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return();
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message without body by default', function (done) {
        d.mount(['human'], function (body, ctxt) {
            assert(_.isUndefined(body));
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return();
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message with success status code 200 by default', function (done) {
        d.mount(['human'], function (body, ctxt) {
            assert.equal(200, ctxt.options.statusCode);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return();
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message with first argument as body', function (done) {
        d.mount(['human'], function (body, ctxt) {
            assert.deepEqual(body, { by: 'monkey' });
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return({ by: 'monkey' });
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message with sucess status code when first argument is provided', function (done) {
        d.mount(['human'], function (body, ctxt) {
            assert.equal(200, ctxt.options.statusCode);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return({ by: 'monkey' });
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message with second argument extending options', function (done) {
        d.mount(['human'], function (body, ctxt) {
            assert.equal('liam', ctxt.options.jealous);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return(null, { jealous: 'liam' });
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message with second argument and default success status code', function (done) {
        d.mount(['human'], function (body, ctxt) {
            assert.equal(200, ctxt.options.statusCode);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return(null, { jealous: 'liam' });
        });
        d.send(['nice'], ['human']);
    });

    it('should send a message with second argument overriding status code', function (done) {
        d.mount(['human'], function (body, ctxt) {
            assert.equal(1001, ctxt.options.statusCode);
            done();
        });
        d.mount(['nice'], function (body, ctxt) {
            ctxt.return(null, { statusCode: 1001 });
        });
        d.send(['nice'], ['human']);
    });

});
