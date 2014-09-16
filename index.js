/*jslint node: true */
"use strict";

var _ = require('underscore');
var HevEmitter = require('HevEmitter').EventEmitter;
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

var mountParametrized = function (domain, point, host) {
    var params = [];
    point = _.map(point, function (name, index) {
        if (name[0] === ':') {
            params.push([name.slice(1), index]);
            return '*'
        }
        else {
            return name;
        }
    });
    var f;
    if (params.length === 0) {
        f = host;
    }
    else {
        var parseParams = function (msg) {
            msg.params = {};
            _.each(params, function (param) {
                msg.params[param[0]] = msg.to[param[1]];
            });
        };

        if (host.length === 2) {
            f = function (msg, next) {
                parseParams(msg);
                return host(msg, next);
            }
        }
        else {
            f = function (msg) {
                parseParams(msg);
                return host(msg);
            }
        }
    }
    domain.on(point, f);
};

var Domain = function () {
    var _this = this;
    _this.hosts = {};
    HevEmitter.call(_this);
    _this.uid = 0;
};

inherits(Domain, HevEmitter);

_.extend(Domain.prototype, {
    mount: function (point, host) {
        var _this = this;
        if (_.isFunction(host)) {
            mountParametrized(_this, point, host);
        }
        else if (_.isObject(host)) {
            _.each(host, function (f, n) {
                mountParametrized(_this, point.concat(n), f);
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
        return _this.emit(to, new MessageContext(_.extend({}, { domain: _this }, {
            to: to
            , from: from
            , body: body
        })))
            .then(function (called) {
                if (!called) {
                    console.error('Dropped message: ', JSON.stringify(to));
                }
                return called
            });
    }
    , nextid: function () {
        return '' + ((this.uid)++);
    }
    , get: function (to, body) {
        var _this = this;
        var domain = _this;
        return new Promise(function (resolve, reject) {
            var from = [_this.nextid()];
            domain.once(from, function (ctxt) {
                if (ctxt.error) {
                    return reject(ctxt.error);
                }
                resolve(new MessageContext(ctxt));
            })
            return domain.send(to, from, body)
                .catch(reject);
        });
    }
    , live: function (to) {
        var _this = this;
        var domain = _this;
        var from = [_this.nextid()];
        var liveEmitter = new HevEmitter();
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
            };
        }
        else {
            transferToDomain = openTransfer;
        }
        socket.on('dual', transferToDomain);

        var onDisconnect = function () {
            _this.unmount(mount.concat('**'));
            socket.removeListener('dual', transferToDomain);
            socket.removeListener('disconnect', onDisconnect);
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


