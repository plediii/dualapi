/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain, libs) {
    var _ = libs._;
    Domain.prototype.Message.prototype.forward = function (to, options) {
        var d = this.domain;
        d.send(to
               , this.from
               , this.body
               , _.extend({}, this.options, options));

    };
};
