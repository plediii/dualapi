/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain) {
    Domain.prototype.request = function (to, body, options) {
        var _this = this;
        return this.uid()
        .then(function (mailbox) {
            var from = ['request', mailbox];
            var resp = _this.waitFor(mailbox, options)
            .then(function (ctxt) {
                return [ctxt.body, ctxt.options, ctxt];
            })
            .catch(function (err) {
                var ctxt = new _this.Message({
                    body: err
                    , options: { statusCode: 504 }
                });
                return [null, ctxt.options, ctxt];
            });
            if (!_this.send(to, mailbox, body, options)) {
                _this.send(mailbox, [], null, { statusCode: 503 })
            }
            return resp;
        });
    }
};
