var gulp    = require('gulp'),
    babel   = require('gulp-babel'),
    rollup  = require('gulp-rollup');

gulp.task('default', function () {
    return gulp.src('./src/**/*.js')
        .pipe(rollup({
            entry: './src/main.js',
            format: 'umd',
            moduleId: 'suggestions.jquery.js'
        }))
        //.pipe(babel({
        //    plugins: ['transform-es2015-modules-umd']
        //}))
        .pipe(gulp.dest('./dist'));
});