/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('./lodash');

module.exports = function (Domain) {
    Domain.prototype.Message.prototype.proxy = function (to, options) {
        var d = this.domain;
        var _this = this;
        var originalTimeout = options && options.timeout;
        var proxyTimeout = _this.options && _this.options.timeout;
        var timeout = 0;
        if (originalTimeout && proxyTimeout) {
            timeout = Math.min(originalTimeout, proxyTimeout);
        }
        else if (proxyTimeout) {
            timeout = proxyTimeout;
        } 
        else {
            timeout = originalTimeout;
        }
        return d.uid()
        .then(function (mailbox) {
            var from = ['proxy', mailbox];
            var resp = d.waitFor(from, { timeout: timeout })
            .then(function (ctxt) {
                return [ctxt.body, ctxt.options, ctxt];
            })
            .catch(function (err) {
                var ctxt = new d.Message({
                    body: err
                    , options: { statusCode: 504 }
                    , domain: d
                });
                return [null, ctxt.options, ctxt];
            });
            if (!d.send(to, from, _this.body)) {
                d.send(from, [], null, { statusCode: 503 })
            }
            return resp;
        });                
    };
};
