/*jslint node: true */
/* global -Promise */
"use strict";

var dualproto = require('dual-protocol');

module.exports = dualproto.use(require('./src/dualapi'));
module.exports._ = require('./src/lodash');
module.exports.Promise = require('./src/Promise');
