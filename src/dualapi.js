/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain) {
    require('./forward')(Domain);
    require('./proxy')(Domain);
    require('./request')(Domain);
    require('./return')(Domain);
    require('./error')(Domain);
};
