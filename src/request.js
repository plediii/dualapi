/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain) {
    Domain.prototype.request = function (to, body, options) {
        var _this = this;
        return this.uid()
        .then(function (mailbox) {
            var from = ['request', mailbox];
            var resp = _this.waitFor(from, options)
            .then(function (ctxt) {
                return [ctxt.body, ctxt.options, ctxt];
            })
            .catch(function (err) {
                var ctxt = new _this.Message({
                    body: err
                    , options: { statusCode: 504 }
                    , domain: _this
                });
                return [null, ctxt.options, ctxt];
            });
            if (!_this.send(to, from, body, options)) {
                _this.send(from, [], null, { statusCode: 503 })
            }
            return resp;
        });
    };
    Domain.prototype.Message.prototype.request = function () {
        var d = this.domain;
        return d.request.apply(d, arguments);
    };
};
