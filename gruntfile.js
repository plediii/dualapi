/*jslint node: true */
"use strict";
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                laxcomma: true
                , strict: true
                , globals: { 'require': false 
                             , 'describe': false
                             , 'it': false
                             , 'exports': false
                             , 'before': false
                           }
            }
            , all: [ '*.js', 'src/*.js', 'test/*.js']
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Default task(s).
    grunt.registerTask('default', ['jshint']);

};