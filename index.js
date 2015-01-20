/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');
var HevEmitter = require('hevemitter').EventEmitter;
var inherits = require('util').inherits;
var Promise = require('bluebird');
var uid = require('./uid')

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
        options = _.defaults({}, options, { statusCode: '200' });
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
    , error: function (message) {
        var _this = this;
        _this.domain.send(['error'].concat(_this.to), [], {
            message: message
            , ctxt: {
                to: _this.to
                , from: _this.from
                , body: _this.body
                , options: _this.options
            }
        });
    }
});

var mountParametrized = function (domain, point, host) {
    var params = [];
    var tailparams = [];
    if (!(_.isArray(point) && point.length > 0)) {
        throw new Error('Unable to mount empty point');
    }
    point = _.map(point, function (name, index) {
        if (_.isString(name) 
            && name[0] === ':') {
            if (name[1] === ':') {
                tailparams.push([name.slice(2), index]);
                return '**';
            }
            else {
                params.push([name.slice(1), index]);
                return '*';
            }
        }
        else {
            return name;
        }
    });
    var h = Promise.method(host);
    var f;
    if (host.length > 1) {
        f = function (msg, done) {
            return h(msg, done)
                .catch(function (err) {
                    if (!msg.to || msg.to.length < 1
                        || msg.to[0] !== 'error') {
                        return domain.send(['error'].concat(msg.to), [], {
                            error: err
                            , context: { 
                                to: msg.to
                                , from: msg.from
                                , body: msg.body
                                , options: msg.options
                            }
                        });
                    }
                });
        };
    }
    else {
        f = function (msg) {
            return h(msg)
                .catch(function (err) {
                    if (!msg.to || msg.to.length < 1
                        || msg.to[0] !== 'error') {
                        return domain.send(['error'].concat(msg.to), [], {
                            error: err
                            , context: { 
                                to: msg.to
                                , from: msg.from
                                , body: msg.body
                                , options: msg.options
                            }
                        });
                    }
                });
        };
    }
    if (params.length !== 0 
        || tailparams.length !== 0) {
        var parseParams = function (msg) {
            msg.params = {};
            _.each(params, function (param) {
                msg.params[param[0]] = msg.to[param[1]];
            });
            _.each(tailparams, function (tailparam) {
                msg.params[tailparam[0]] = msg.to.slice(tailparam[1]);
            });
        };
        var g = f;
        if (g.length > 1) {
            f = function (msg, next) {
                parseParams(msg);
                return g(msg, next);
            };
        }
        else {
            f = function (msg) {
                parseParams(msg);
                return g(msg);
            };
        }
    }
    domain.on(point, f);
};

var Domain = function (options) {
    var _this = this;
    _this.hosts = {};
    HevEmitter.call(_this);
    _this.uid = 0;
    _this.options = options || {};
};

inherits(Domain, HevEmitter);

_.extend(Domain.prototype, {
    mount: function (point, host) {
        var _this = this;

        if (arguments.length < 2)
        {
            host = point;
            point = [];
        }

        if (_.isString(point)) {
            point = [point];
        }

        if (_.isFunction(host)) {
            mountParametrized(_this, point, host);
        }
        else if (_.isArray(host)) {
            _.each(host, function (f) {
                if (_.isFunction(f)) {
                    mountParametrized(_this, point, f);
                }
                else {
                    _this.mount(point, f);
                }
            });
        }
        else if (_.isObject(host)) {
            _.each(host, function (f, n) {
                if (_.isObject(f)) {
                    _this.mount(point.concat(n), f);
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
        if (!to || to.length < 1) {
            return;
        }
        return _this.emit(to, new MessageContext(_.defaults({
            domain: _this
            , to: to
            , from: from
            , body: body
            , options: options
        })))
            .then(function (called) {
                if (!called && _this.options.verbose) {
                    console.error('Dropped message: ', JSON.stringify(to));
                }
                return called;
            });
    }
    , nextid: function () {
        return '' + ((this.uid)++);
    }
    , get: function (to, body, options) {
        var _this = this;
        var domain = _this;
        options = _.defaults({}, options, {
            timeout: 120
        });
        return uid()
            .then(function (requestid) {
                var from = ['request', requestid];
                var timer;
                var receiver;
                if (options.timeout > 0) {
                    timer = setTimeout(function () {
                        domain.removeListener(from, receiver);
                        resolve(new MessageContext({
                            options: {
                                statusCode: '408'
                            }
                        }));
                    }, 1000 * options.timeout);
                }
                receiver = function (ctxt) {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    resolve(new MessageContext(ctxt));
                };
                domain.once(from, receiver);
                return domain.send(to, from, body, options)
                    .then(function (called) {
                        if (!called) {
                            return resolve(new MessageContext({
                                options: {
                                    statusCode: '503'
                                }
                            }));
                        }
                    });
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
    , synchOption: function (name, fetch) {
        var cache = {};
        return function (ctxt, next) {
            var k = ctxt.params[name];
            if (cache.hasOwnProperty(k)) {
                ctxt.options[name] = cache[k];
                next();
            }
            else {
                return fetch(ctxt, function (err, val) {
                    if (!err) {
                        if (!cache.hasOwnProperty(k)) {
                            cache[k] = val;
                        }
                        else {
                            val = cache[k];
                        }
                        ctxt.options[name] = val;
                    }
                    next(err);
                });
            }
        };
    }
});


