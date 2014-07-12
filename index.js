/*jslint node: true */
"use strict";

var _ = require('underscore');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var inherits = require('util').inherits;
var Promise = require('bluebird');

var MessageContext = function (options) {
    var _this = this;
    _.extend(_this, _.pick(options, [
        'domain'
        , 'to'
        , 'from'
        , 'body'
    ]));
};

_.extend(MessageContext.prototype, {
    reply: function (body) {
        var _this = this;
        _this.domain.send(_this.from, _this.to, body);
    }
});

var Domain = function () {
    var _this = this;
    _this.hosts = {};
    EventEmitter2.call(_this, { wildcard: true, verbose: true });
    _this.uid = 0;
};

inherits(Domain, EventEmitter2);

_.extend(Domain.prototype, {
    wrapHost: function (host) {
        var _this = this;
        return function (ctxt) {
            return host(new MessageContext(_.extend({}, { domain: _this }, ctxt)));
        };
    }
    , mount: function (point, host) {
        var _this = this;
        if (_.isFunction(host)) {
            _this.on(point, _this.wrapHost(host));
        }
        else if (_.isObject(host)) {
            _.each(host, function (f, n) {
                _this.on(point.concat(n), _this.wrapHost(f));
            });
        }
    }
    , send: function (to, from, body) {
        var _this = this;
        if (!_this.emit(to, {
            to: to
            , from: from
            , body: body
        })) {
            throw 'No such host on this domain' + JSON.stringify(to);
        }
    }
    , nextid: function () {
        return '' + ((this.uid)++);
    }
    , get: function (to) {
        var _this = this;
        var domain = _this;
        return new Promise(function (resolve, reject) {
            var from = [_this.nextid()];
            domain.once(from, function (ctxt) {
                if (ctxt.error) {
                    return reject(ctxt.error);
                }
                resolve(new MessageContext(ctxt));
            });
            return domain.send(to, from);
        });
    }
    // , live: function (to) {
    //     var _this = this;
    //     var domain = _this;
    //     return new Promise(function (resolve, reject) {
    //         var from = [_this.nextid()];
    //         domain.once(from, function (ctxt) {
    //             if (ctxt.error) {
    //                 return reject(ctxt.error);
    //             }
    //             var liveEmitter = new EventEmitter2();
    //             resolve(liveEmitter);
    //             var forwarder =  function (ctxt) {
    //                 liveEmitter.emit('message', new MessageContext(ctxt));
    //             };
    //             domain.on(from, forwarder);
    //         });
    //         if (!domain.send(to, from)) {
    //             reject('No such host on this domain.');
    //         }
    //     });
    // }
});

module.exports = function () {
    return new Domain();
};


