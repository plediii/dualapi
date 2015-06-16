/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');

module.exports = function (Domain) {
    Domain.prototype.Message.prototype.return = function (body, options) {
        var d = this.domain;
        d.send(this.from
               , []
               , body
               , _.defaults({}, options, { statusCode: 200 }));
    };
};
