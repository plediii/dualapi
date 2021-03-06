/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain, libs) {
    var _ = libs._;
    Domain.prototype.Message.prototype.return = function (body, options) {
        var d = this.domain;
        d.send(this.from
               , ['_return'].concat(void 0)
               , body
               , _.defaults({}, options, { statusCode: 200 }));
    };
};
