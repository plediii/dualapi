/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('./lodash');

module.exports = function (Domain) {
    Domain.prototype.Message.prototype.return = function (body, options) {
        var d = this.domain;
        d.send(this.from
               , ['_return'].concat(this.from).concat(void 0)
               , body
               , _.defaults({}, options, { statusCode: 200 }));
    };
};
