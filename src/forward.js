/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('./lodash');

module.exports = function (Domain) {
    Domain.prototype.Message.prototype.forward = function (to, options) {
        var d = this.domain;
        d.send(to
               , this.from
               , this.body
               , _.extend({}, this.options, options));

    };
};
