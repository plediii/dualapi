/*jslint node: true */
"use strict";

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

gulp.task('lint', function() {
  return gulp.src(['*.js', 'src/*.js', 'test/*.js', 'examples/*.js'])
        .pipe(jshint({
            laxcomma: true
            , laxbreak: true
            , strict: true
            , globals: { 'require': false 
                         , 'describe': false
                         , 'it': false
                         , 'exports': false
                         , 'before': false
                       }
        }))
    .pipe(jshint.reporter(stylish));
});

gulp.task('default', ['lint']);
