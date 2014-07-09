/*jslint node: true */
"use strict";

var _ = require('underscore');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var inherits = require('util').inherits;
var Promise = require('bluebird');

var BroadCaster = function (domain, mount, allower) {
    var _this = this;
    _this.domain = domain;
    _this.mount = mount;
    _this.forwarders = [];
    domain.on(_this.mount, function (ctxt) {
        return allower(ctxt, function (allow) {
            if (!allow) {
                return domain.send(ctxt.from, _this.mount, null, 'Not allowed.');
            }
            var f = function (body) {
                return domain.send(ctxt.from, _this.mount, body);
            };
            domain.broadcast.on(_this.mount, f);
            _this.forwarders.push([ctxt.from, f]);
        });
    });
};

_.extend(BroadCaster.prototype, {
    close: function () {
        var _this = this;
        var broadcast = _this.domain.broadcast;
        _this.domain.disconnect.emit(_this.mount);
        _.each(_this.forwarders, function (forwarder) {
            broadcast.removeListener.apply(broadcast, forwarder);
        });
    }
});

var Host = function (domain, mount) {
    var _this = this;
    _this.mount = mount;
    _this.domain = domain;
    _this.hosts = {};
};

inherits(Host, EventEmitter2);

_.extend(Host.prototype, {
    host: function (relative) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(relative)) {
            var mount = _this.mount.concat(relative);
            _this.hosts[relative] = new Host(_this.domain, mount);
            _this.domain.disconnect.once(mount, function () {
                delete _this.hosts[relative];
            });
        }
        return _this.hosts[relative];
    }
    , endpoint: function (relative, proto) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(relative)) {
            var mount = _this.mount.concat(relative);
            _this.hosts[relative] = new Endpoint(_this.domain, mount, proto);
            _this.domain.disconnect.once(mount, function () {
                delete _this.hosts[relative];
            });
        }
        return _this.hosts[relative];
    }
    , broadcaster: function (relative, allower) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(relative)) {
            var mount = _this.mount.concat(relative);
            _this.hosts[mount] = new BroadCaster(_this, mount, allower);
            _this.disconnect.once(mount, function () {
                delete _this.hosts[relative];
            });
        }
        return _this.hosts[mount];
    }
    , close: function () {
        var _this = this;
        _.each(_this.hosts, function (subhost) {
            subhost.close();
        });
        _this.domain.disconnect.emit(_this.mount);
    }
});

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

var Endpoint = function (domain, mount, proto) {
    var _this = this;
    _this.domain = domain;
    _this.mount = mount;
    _this.proto = proto;
    _.each(proto, function (f, name) {
        var to = mount.concat(name);
        _this.domain.on(to, function (ctxt) {
            proto[name].call(_this, new MessageContext(_.extend({}, ctxt, {
                domain: _this.domain
            })));
        });
    });
};

_.extend(Endpoint.prototype, {
    send: function (to, relative, body) {
        var _this = this;
        _this.domain.send(to, _this.mount.concat(relative), body);
    }
    , close: function () {
        var _this = this;
        _this.domain.disconnect.emit(_this.mount);
    }
});

var socketHost = function (socket) {
    socket.trigger = function () {
        socket.emit.apply(socket, arguments);
    };
    return socket;
};


var Domain = function () {
    var _this = this;
    _this.hosts = {};
    EventEmitter2.call(_this, { wildcard: true, verbose: true });
    _this.uid = 0;
    _this.disconnect = new EventEmitter2();
    _this.broadcast = new EventEmitter2();
};

inherits(Domain, EventEmitter2);

_.extend(Domain.prototype, {
    host: function (mount) {
        var _this = this;
        if (_this.hosts.hasOwnProperty(mount)) {
            return _this.hosts[mount];
        }
        else {
            _this.hosts[mount] = new Host(_this, [mount]);
            _this.disconnect.once(mount, function () {
                delete _this.hosts[mount];
            });
        }
        return _this.hosts[mount];
    }
    , endpoint: function (mount, proto) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(mount)) {
            _this.hosts[mount] = new Endpoint(_this, [mount], proto);
            _this.disconnect.once(mount, function () {
                delete _this.hosts[mount];
            });
        }
        return _this.hosts[mount];
    }
    , broadcaster: function (mount, allower) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(mount)) {
            _this.hosts[mount] = new BroadCaster(_this, [mount], allower);
            _this.disconnect.once(mount, function () {
                delete _this.hosts[mount];
            });
        }
        return _this.hosts[mount];
    }
    , send: function (to, from, body, err) {
        var _this = this;
        return _this.emit(to, {
            to: to
            , from: from
            , body: body
            , error: err
        });
    }
    , broadcast: function (to, body, err) {
        var _this = this;
        return _this.broadcast.emit(to, {
            to: to
            , from: to
            , body: body
            , error: err
        });
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
            if (!domain.send(to, from)) {
                reject('No such host on this domain.');
            }
        });
    }
    , live: function (to) {
        var _this = this;
        var domain = _this;
        return new Promise(function (resolve, reject) {
            var from = [_this.nextid()];
            domain.once(from, function (ctxt) {
                if (ctxt.error) {
                    return reject(ctxt.error);
                }
                var liveEmitter = new EventEmitter2();
                resolve(liveEmitter);
                var forwarder =  function (ctxt) {
                    liveEmitter.emit('message', new MessageContext(ctxt));
                };
                domain.on(from, forwarder);
            });
            if (!domain.send(to, from)) {
                reject('No such host on this domain.');
            }
        });
    }
});

module.exports = function () {
    return new Domain();
};


