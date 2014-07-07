/*jslint node: true */
"use strict";

var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var Host = function (mount) {
    var _this = this;
    _this.mount = mount;
    EventEmitter.apply(_this);
    _this.hosts = {};
};

inherits(Host, EventEmitter);

_.extend(Host.prototype, {
    send: function (to, ctxt) {
        var _this = this;
        var next = _.head(to);
        if (_this.hosts.hasOwnProperty(next)) {
            _this.hosts[next].send(_.tail(to), ctxt);
        }
    }
    , host: function (mount, obj) {
        var _this = this;
        if (obj) {
            _this.hosts[mount] = obj;
            return obj;
        }
        else if (!_this.hosts.hasOwnProperty(mount)) {
            _this.hosts[mount] = new Host(mount);
        }
        return _this.hosts[mount];
    }
    , endpoint: function (mount, proto) {
        var _this = this;
        if (!_this.hosts.hasOwnProperty(mount)) {
            _this.hosts[mount] = new Endpoint(mount, proto);
        }
        _this.hosts[mount];
    }
});

var MessageContext = function (domain, to, from, body) {
    var _this = this;
    _this.domain = domain;
    _this.to = to;
    _this.from = from;
    _this.body = body;
};

var Endpoint = function (mount, proto) {
    var _this = this;
    _this.mount = mount;
    _this.proto = proto;
};

_.extend(Endpoint.prototype, {
    send: function (to, ctxt) {
        var _this = this;
        var next = _.head(to);
        if (_this.proto.hasOwnProperty(next)) {
            _this.proto[next](to, ctxt);
        }
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
    Host.apply(this);
};

inherits(Domain, Host);

_.extend(Domain.prototype, {
    send: function (to, from, body) {
        var _this = this;
        var next = _.head(to);
        if (_this.hosts.hasOwnProperty(next)) {
            _this.hosts[next].send(_.tail(to), new MessageContext(_this, to, [], body));
        }
    }
});

var domain = function () {
    var d = new Host();
    var hosts = {};

    return {
        host: function (mount) {
            var h = new Host(mount);
            hosts[mount] = h;
            h.serve(d);
            return h;
        }
    };
};

module.exports = function () {
    return new Domain();
};


