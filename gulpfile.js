var gulp    = require('gulp'),
    rollup  = require('gulp-rollup'),
    rename  = require('gulp-rename'),

    SRC_DIR = 'src_es6';

gulp.task('build', function () {
    return gulp.src('./' + SRC_DIR + '/**/*.js')
        .pipe(rollup({
            entry: './' + SRC_DIR + '/main.js',
            format: 'umd',
            moduleId: 'jquery.suggestions.js',
            globals: {
                jquery: '$'
            },
            external: ['jquery']
        }))
        .pipe(rename('jquery.suggestions.js'))
        .pipe(gulp.dest('./dist/js'));
});
