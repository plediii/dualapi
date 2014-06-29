
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var Host = function () {
    var _this = this;
    _this.actions = {};
};

inherits(Host, EventEmitter);

_.extend(Host.prototype, {
    action: function (name) {
        var _this = this;
        _this.actions[name] = _this.actions[name] || [];
        var routes = _this.actions[name];
        return {
            route: function (route) {
                return {
                    use: function (cb) {
                        routes.push([route, cb]);
                    }
                };
            }
        };
    }
    , trigger: function (name, target, msg, remote) {
        var _this = this;
        _.each(_this.actions[name], function (routecb) {
            var route = routecb[0];
            var cb = routecb[1];
            if (_.isEqual(route, target.slice(0, route.length))) {
                cb(target.slice(route.length), msg, remote);
            }
        });
    }
    , serve: function (remote) {
        var _this = this;
        _.each(_this.actions, function (routes, name) {
            remote.on(name, function (target, msg) {
                _this.trigger(name, target, msg, remote);
            });
        });
    }
});

_.extend(exports, {
    Host: Host
});
