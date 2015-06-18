/*jslint node: true */
/* global -Promise */
"use strict";

var dualproto = require('dual-protocol');

module.exports = dualproto.use(require('./src/dualapi'));
