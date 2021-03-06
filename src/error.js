/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('./lodash');

module.exports = function (Domain) {
    Domain.prototype.Message.prototype.error = function (body, options) {
        var d = this.domain;
        body = body || 'An error occured while processing ' + this.to.join('/');
        if (!(body instanceof Error)) {
            body = new Error(JSON.stringify(body));
        }
        body.ctxt = this.toJSON();
        d.send({
            to: ['error'].concat(this.to)
            , from: ['_return'].concat(this.from).concat(void 0)
            , body: body
            , options: options });
    };
};
