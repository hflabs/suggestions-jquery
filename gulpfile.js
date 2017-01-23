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
    jasmine     = require('gulp-jasmine-phantom'),
    jasmine2    = require('gulp-jasmine-browser'),

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
    sequence('build');
});

gulp.task('dev', function (callback) {
    devMode = true;
    sequence('build', 'watch', callback);
});

gulp.task('test', function () {
    //return gulp.src(['./test/specs/**/*.js'])
    return gulp.src(['test/specs/addon_spec.js'])
    //return gulp.src(['./test/runner.html'])
        .pipe(jasmine({
            //specs: 'test/specs/*.js',
            //helpers: 'test/helpers/*.js',
            //vendor: 'test/vendor/*.js',
            //styles: 'dist/css/*.css',
            //outfile: 'test/runner.html',

            integration: true,
            //specHtml: './test/runner.html',
            keepRunner: './',
            //includeStackTrace: true,
            vendor: [
                './test/vendor/**/*.js',
                //'./test/helpers/helpers.js',
                './test/helpers/**/*.js',
                './dest/js/jquery.suggestions.js'
            ]
        }));
});

gulp.task('test2', function () {
    //return gulp.src(['./test/**/*'])
    return gulp.src([
        //'.grunt/grunt-contrib-jasmine/es5-shim.js',
        //'.grunt/grunt-contrib-jasmine/jasmine.js',
        //'.grunt/grunt-contrib-jasmine/jasmine-html.js',
        //'.grunt/grunt-contrib-jasmine/json2.js',
        //'.grunt/grunt-contrib-jasmine/boot.js',
        'test/vendor/jquery-1.9.1.js',
        'test/helpers/helpers.js',
        'test/helpers/jasmine-jquery-2.0.5.js',
        'test/helpers/sinon-1.7.1.js',
        'dist/js/jquery.suggestions.js',

        //'./test/vendor/**/*.js',
        //'./test/helpers/jasmine-jquery-2.0.5.js',
        //'./test/helpers/sinon-1.7.1.js',
        'test/specs/add_space_on_select_spec.js'

        //'.grunt/grunt-contrib-jasmine/reporter.js'
    ])
        .pipe(jasmine2.specRunner({
            console: true,
            //specs: 'test/specs/*.js',
            //helpers: 'test/helpers/*.js',
            //vendor: 'test/vendor/*.js',
            //styles: 'dist/css/*.css',
            //outfile: 'test/runner.html',

            //integration: true,
            //specHtml: './test/runner.html',
            //keepRunner: true,
            //includeStackTrace: true,
            /*vendor: [
                './test/vendor/!**!/!*.js',
                './test/helpers/helpers.js',
                './test/helpers/sinon-1.7.1.js',
                './dest/js/jquery.suggestions.js'
            ]*/
        }))
        .pipe(jasmine2.headless());
});

//@TODO ending в тестах
//@TODO тесты
