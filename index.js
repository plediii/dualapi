/*jslint node: true */
"use strict";

var _ = require('underscore');
var HevEmitter = require('HevEmitter').EventEmitter;
var inherits = require('util').inherits;
var Promise = require('bluebird');

var MessageContext = function (options) {
    var _this = this;
    _.extend(_this, _.defaults(_.pick(options, 'domain', 'to', 'from', 'body', 'options')
                              , {
                                  to: []
                                  , from: []
                                  , options: {}
                              }));
};

_.extend(MessageContext.prototype, {
    reply: function (body, options) {
        var _this = this;
        return _this.domain.send(_this.from, _this.to, body, options);
    }
    , forward: function (to, options) {
        var _this = this;
        return _this.domain.send(to, _this.from, _this.body, _.extend({}, _this.options, options));
    }
    , transfer: function (mount, socket, options) {
        var _this = this;
        socket.emit('dual', {
            to: _this.to.slice(mount.length)
            , from: _this.from
            , body: _this.body
            , options: _.extend({}, _this.options, options)
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

var validPoint = function (point) {
    return _.isArray(point) || _.isString(point);
};

_.extend(Domain.prototype, {
    mount: function (point, host) {
        var _this = this;
        if (!validPoint(point))
        {
            host = point;
            point = [];
        }
            
        if (_.isFunction(host)) {
            mountParametrized(_this, point, host);
        }
        else if (_.isArray(host)) {
            _.each(host, function (f) {
                if (!validPoint(f)) {
                    _this.mount(point, f)
                }
                else {
                    mountParametrized(_this, point, f);
                }
            });
        }
        else if (_.isObject(host)) {
            _.each(host, function (f, n) {
                if (_.isObject(f)) {
                    _this.mount(point.concat(n), f)
                }
                else {
                    mountParametrized(_this, point.concat(n), f);
                }
            });
        }
        return _this;
    }
    , unmount: function (point) {
        var _this = this;
        _this.removeAllListeners(point);
        _this.removeAllListeners(point.concat('**'));
    }
    , send: function (to, from, body, options) {
        var _this = this;
        return _this.emit(to, new MessageContext(_.defaults({
            domain: _this
            , to: to
            , from: from
            , body: body
            , options: options
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
    , get: function (to, body, options) {
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
            return domain.send(to, from, body, options)
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
            return _this.send(ctxt.to, mount.concat(ctxt.from), ctxt.body, ctxt.options);
        };
        if (firewall) {
            transferToDomain = function (ctxt) {
                var to = _.clone(ctxt.to);
                var from = _.clone(ctxt.from);
                firewall(ctxt, function (ok, options) {
                    if (ok) {
                        openTransfer(_.extend(ctxt, {
                            to: to
                            , from: from
                            , options: options || {}
                        }));
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
    , bridge: function (remote, routes, fromRoutes) {
        var _this = this;
        _.each(routes, function (route) {
            _this.mount(route.concat('**'), function (ctxt) {
                remote.send(ctxt.to, ctxt.from, ctxt.body, ctxt.options);
            });
        });
        if (fromRoutes) {
            remote.bridge(_this, fromRoutes);
        }
    }
});

module.exports = function () {
    return new Domain();
};

_.extend(module.exports, {
    MessageContext: MessageContext
    , broadcaster: broadcaster
});


