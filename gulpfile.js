var pkg         = require('./package.json'),
    gulp        = require('gulp'),
    rollup      = require('gulp-rollup'),
    rename      = require('gulp-rename'),
    banner      = require('gulp-banner'),
    ending      = require('gulp-line-ending-corrector'),
    uglify      = require('gulp-uglify'),
    replace     = require('gulp-replace'),
    less        = require('gulp-less'),
    sequence    = require('run-sequence'),
    gulpif      = require('gulp-if'),
    karma       = require('karma').Server,

    SRC_DIR = './src_es6/',
    LESS_SRC_DIR = './less/',
    DIST_DIR = './dist/',

    devMode = false,

    comment = [
        '/**',
        ' <%= pkg.description %>, version <%= pkg.version %>',
        '',
        ' <%= pkg.description %> is freely distributable under the terms of MIT-style license',
        ' Built on DevBridge Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)',
        ' For details, see <%= pkg.homepage %>',
        '/\n'].join('\n *');

gulp.task('build-script', function () {
    return gulp.src(SRC_DIR + '**/*.js')
        .pipe(gulpif(!devMode, ending({ eolc: 'LF' })))
        .pipe(gulpif(!devMode, gulp.dest(SRC_DIR)))
        .pipe(rollup({
            entry: SRC_DIR + 'main.js',
            format: 'umd',
            moduleId: 'jquery.suggestions.js',
            globals: {
                jquery: '$'
            },
            external: ['jquery']
        }))
        .pipe(rename('jquery.suggestions.js'))
        .pipe(banner(comment, { pkg: pkg }))
        .pipe(replace('%VERSION%', pkg.version))
        .pipe(ending({ eolc: 'LF' }))
        .pipe(gulp.dest(DIST_DIR + 'js'))
        .pipe(uglify({ mangle: true }))
        .pipe(rename('jquery.suggestions.min.js'))
        .pipe(gulp.dest(DIST_DIR + 'js'))
});

gulp.task('build-style', function () {
    return gulp.src(LESS_SRC_DIR + '**/*')
        .pipe(gulpif(devMode, ending({ eolc: 'LF' })))
        .pipe(gulpif(devMode, gulp.dest(LESS_SRC_DIR)))
        .pipe(less())
        .pipe(gulp.dest(DIST_DIR + 'css'))
});

gulp.task('build', function (callback) {
    return sequence(['build-script', 'build-style'], callback);
});

gulp.task('watch', function () {
    gulp.watch([SRC_DIR + '**/*'], ['build-script']);
    gulp.watch([LESS_SRC_DIR + '**/*'], ['build-style']);
});

gulp.task('default', function (callback) {
    sequence('build', 'test', callback);
});

gulp.task('dev', function (callback) {
    devMode = true;
    sequence('build', 'watch', callback);
});

gulp.task('test-phantomjs', function (callback) {
    new karma({
        configFile: __dirname + '/test/karma.phantomjs.js',
        singleRun: true
    }, callback).start();
});

gulp.task('test-phantomjs-min', function (callback) {
    new karma({
        configFile: __dirname + '/test/karma.phantomjs.min.js',
        singleRun: true
    }, callback).start();
});

gulp.task('test', function (callback) {
    sequence('test-phantomjs', 'test-phantomjs-min', callback);
});

gulp.task('test-chrome', function (callback) {
    new karma({
        configFile: __dirname + '/test/karma.chrome.js',
    }, callback).start();
});