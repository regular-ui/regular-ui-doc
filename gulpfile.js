'use strict';

let gulp = require('gulp');
let rm = require('gulp-rimraf');
let all = require('gulp-all');
let sequence = require('run-sequence');

let build = require('./src/gulp-build.js');

/**
 * ------------------------------------------------------------
 * Build Doc
 * ------------------------------------------------------------
 */

gulp.task('doc-clean', (done) => {
    return gulp.src('./doc', {read: false}).pipe(rm());
});

gulp.task('doc-copy', (done) => {
    return all(
        gulp.src('./src/assets/**').pipe(gulp.dest('./doc')),
        gulp.src('./node_modules/font-awesome/fonts/**').pipe(gulp.dest('./doc/fonts')),
        gulp.src(['./node_modules/babel-polyfill/dist/polyfill.min.js']).pipe(gulp.dest('./doc/vendor')),
        gulp.src(['./node_modules/regularjs/dist/regular.min.js']).pipe(gulp.dest('./doc/vendor'))
    );
});

gulp.task('doc-build', (done) => {
    return gulp.src('./src/content/**/*')
        .pipe(build())
        .pipe(gulp.dest('./doc'));
});

gulp.task('doc-watch', ['doc-copy', 'doc-build'], (done) => {
    gulp.watch('src/assets/**', ['doc-copy']);
    gulp.watch('src/content/**', ['doc-build']);
});

/**
 * ------------------------------------------------------------
 * Sync to GitHub Page
 * If start `page` task, `doc` task will be running previously.
 * ------------------------------------------------------------
 */

gulp.task('page-clean', function() {
    return gulp.src('../regular-ui.github.io/v0.2/*', {read: false}).pipe(rm({force: true}));
});

gulp.task('page-copy', function() {
    return gulp.src('./doc/**').pipe(gulp.dest('../regular-ui.github.io/v0.2'));
});

gulp.task('page', function(done) {
    sequence(['doc', 'page-clean'], ['page-copy'], done);
});

gulp.task('doc', (done) => {
    sequence('doc-clean', 'doc-copy', ['doc-build'], done);
});

gulp.task('watch', ['doc-watch']);
gulp.task('default', ['doc-watch']);
