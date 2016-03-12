'use strict';

const fs              = require('fs');
const gulp            = require('gulp');
const karma           = require('karma');
const rimraf          = require('rimraf');
const browserify      = require('browserify');
const babel           = require('gulp-babel');
const mocha           = require('gulp-mocha');
const eslint          = require('gulp-eslint');
const uglify          = require('gulp-uglify');
const rename          = require('gulp-rename');
const runSequence     = require('run-sequence');
const testEnvironment = require('./test/test-environment');

gulp.task('lint', function () {
  return gulp.src(['*.js', 'src/**/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('clean', function (done) {
  rimraf('lib', done);
});

gulp.task('build', function (done) {
  runSequence('clean', ['build:node', 'build:browser'], 'minify', done);
});

gulp.task('build:node', function () {
  return gulp.src('src/**/*.js')
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('lib'));
});

gulp.task('build:browser', function () {
  if (!fs.existsSync('lib')) fs.mkdirSync('lib');
  return browserify('src/index.js')
    .transform('babelify', {
      presets: ['es2015'],
      plugins: ['transform-es2015-modules-umd'],
      moduleId: 'multiagent'
    })
    .bundle()
    .pipe(fs.createWriteStream('lib/browser.js'));
});

gulp.task('minify', function() {
  return gulp.src('lib/browser.js')
    .pipe(uglify())
    .pipe(rename('browser.min.js'))
    .pipe(gulp.dest('lib'));
});

gulp.task('start-test-environment', function (done) {
  testEnvironment.start().then(() => done(), done);
});

gulp.task('stop-test-environment', function (done) {
  testEnvironment.stop().then(() => done(), done);
});

gulp.task('test', function (done) {
  runSequence('start-test-environment', 'test:node', 'test:browser', 'stop-test-environment', done);
});

gulp.task('test:node', function () {
  return gulp.src('test/**/*.specs.js')
    .pipe(mocha())
    .on('error', function (err) {
      console.error(err.toString());
      this.emit('end');
    });
});

gulp.task('test:browser', function (done) {
  new karma.Server({ configFile: `${__dirname}/karma.conf.js` }, () => done()).start();
});

gulp.task('watch', function () {
  return gulp.watch(['src/**/*.js', 'test/**/*.js'], ['test']);
});

gulp.task('default', ['watch']);
