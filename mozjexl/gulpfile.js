/*
 * Jexl
 * Copyright (c) 2015 TechnologyAdvice
 */
/* eslint import/no-extraneous-dependencies: [error, {devDependencies: true}] */
'use strict';

const browserify = require('browserify');
const gulp = require('gulp');
const transform = require('vinyl-transform');
const rename = require('gulp-rename');
const path = require('path');
const coverageEnforcer = require('gulp-istanbul-enforcer');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');

gulp.task('dist', () => {
  // transform regular node stream to gulp (buffered vinyl) stream
  const browserified = transform((filename) => {
    const b = browserify({
      paths: [path.dirname(filename)],
    });
    b.require(path.basename(filename, '.js'));
    return b.bundle();
  });
  return gulp.src('./lib/Jexl.js')
    .pipe(browserified)
    .pipe(rename({
      basename: 'mozjexl',
      extname: '.min.js',
    }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('coverage-test', (cb) => {
  const passThresholds = {
    thresholds: {
      statements: 95,
      branches: 88,
      lines: 95,
      functions: 92,
    },
    coverageDirectory: 'coverage',
    rootDirectory: '',
  };
  gulp.src(['test/**/*.js'])
    .pipe(mocha())
    .on('end', () => {
      gulp.src(['lib/**/*.js'])
        .pipe(istanbul({ includeUntested: true }))
        .pipe(istanbul.hookRequire())
        .on('finish', () => {
          gulp.src(['test/**/*.js'])
            .pipe(mocha({ reporter: 'min' }))
            .pipe(istanbul.writeReports({
              reporters: ['json', 'lcovonly'],
            }))
            .on('finish', () => {
              gulp.src('.')
                .pipe(coverageEnforcer(passThresholds))
                .on('end', cb);
            });
        });
    });
});

gulp.task('default', ['dist']);
