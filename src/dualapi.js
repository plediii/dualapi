/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain, libs) {
    require('./forward')(Domain, libs);
    require('./proxy')(Domain, libs);
    require('./request')(Domain, libs);
    require('./return')(Domain, libs);
    require('./error')(Domain, libs);
};
