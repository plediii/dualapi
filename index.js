/*jslint node: true */
"use strict";

var _ = require('underscore');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var inherits = require('util').inherits;
var Promise = require('bluebird');

var Host = function (domain, mount) {
    var _this = this;
    _this.mount = mount;
    _this.domain = domain;
    _this.hosts = {};
};

// inherits(Host, EventEmitter);

_.extend(Host.prototype, {
    host: function (relative) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(relative)) {
            _this.hosts[relative] = new Host(_this.domain, _this.mount.concat(relative));
        }
        return _this.hosts[relative];
    }
    , endpoint: function (relative, proto) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(relative)) {
            _this.hosts[relative] = new Endpoint(_this.domain, _this.mount.concat(relative), proto);
        }
        return _this.hosts[relative];
    }
    , close: function () {
        console.log('todo: disconnect this host');
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
});

inherits(Endpoint, Host);

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
};

inherits(Domain, EventEmitter2);

_.extend(Domain.prototype, {
    host: function (mount) {
        var _this = this;
        mount = [mount];
        if (_this.hosts.hasOwnProperty(mount)) {
            return _this.hosts[mount];
        }
        else {
            _this.hosts[mount] = new Host(_this, mount);
        }
        return _this.hosts[mount];
    }
    , endpoint: function (mount, proto) {
        var _this = this;
        mount = [mount];
        if (!_this.hosts.hasOwnProperty(mount)) {
            _this.hosts[mount] = new Endpoint(_this, _this.mount.concat(relative), proto);
        }
        return _this.hosts[mount];
    }
    , send: function (to, from, body) {
        var _this = this;
        _this.emit(to, {
            to: to
            , from: from
            , body: body
        });
    }
    , nextid: function () {
        return '' + ((this.uid)++);
    }
    , get: function (to) {
        var _this = this;
        var domain = _this;
        return new Promise(function (resolve) {
            var from = [_this.nextid()];
            domain.once(from, function (ctxt) {
                resolve(new MessageContext(ctxt));
            });
            domain.send(to, from);
        });
    }
});

module.exports = function () {
    return new Domain();
};


