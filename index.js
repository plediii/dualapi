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
        return _this.domain.send(_this.from, _this.to, body);
    }
    , forward: function (to) {
        var _this = this;
        return _this.domain.send(to, _this.from, _this.body);
    }
    , transfer: function (mount, socket) {
        var _this = this;
        socket.emit('dual', {
            to: _this.to.slice(mount.length)
            , from: _this.from
            , body: _this.body
        });
    }
});

var broadcaster = function (allower) {
    
    var subscribers = [];

    return {
        subscribe: function (ctxt) {
            return allower(ctxt, function (allow) {
                if (allow) {
                    subscribers.push(ctxt.from);
                }
            });
        }
        , broadcast: function (ctxt) {
            subscribers = _.filter(subscribers, function (to) {
                return ctxt.forward(to);
            });
        }
    };
};

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
    , unmount: function (point) {
        var _this = this;
        _this.removeAllListeners(point);
        _this.removeAllListeners(point.concat('**'));
    }
    , send: function (to, from, body) {
        var _this = this;
        if (!_this.emit(to, {
            to: to
            , from: from
            , body: body
        })) {
            console.error('Dropped message: ', JSON.stringify(to));
            return false;
        }
        return true;
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
    , live: function (to) {
        var _this = this;
        var domain = _this;
        var from = [_this.nextid()];
        var liveEmitter = new EventEmitter2();
        var forwarder =  function (ctxt) {
            liveEmitter.emit('dual', new MessageContext(ctxt));
        };
        domain.on(from, forwarder);
        domain.send(to.concat('subscribe'), from);
        return liveEmitter;
    }
    , open: function (mount, socket, firewall) {
        var _this = this;
        _this.mount(mount.concat('**'), function (ctxt) {
            return ctxt.transfer(mount, socket);
        });
        var transferToDomain;
        var openTransfer = function (ctxt) {
            return _this.send(ctxt.to, mount.concat(ctxt.from), ctxt.body);
        };
        if (firewall) {
            transferToDomain = function (ctxt) {
                firewall({
                    to: _.clone(ctxt.to)
                    , from: _.clone(ctxt.from)
                }, function (ok) {
                    if (ok) {
                        openTransfer(ctxt);
                    }
                });
            }
        }
        else {
            transferToDomain = openTransfer;
        }
        socket.on('dual', transferToDomain);

        var onDisconnect = function () {
            _this.unmount(mount.concat('**'));
            socket.off('dual', transferToDomain);
            socket.off('disconnect', onDisconnect);
        };
        socket.on('disconnect', onDisconnect);
    }
});

module.exports = function () {
    return new Domain();
};

_.extend(module.exports, {
    MessageContext: MessageContext
    , broadcaster: broadcaster
});


