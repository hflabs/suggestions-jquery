var pkg = require("./package.json"),
    gulp = require("gulp"),
    rollup = require("gulp-rollup"),
    rename = require("gulp-rename"),
    banner = require("gulp-banner"),
    ending = require("gulp-line-ending-corrector"),
    uglify = require("gulp-uglify"),
    replace = require("gulp-replace"),
    less = require("gulp-less"),
    gulpif = require("gulp-if"),
    karma = require("karma").Server,
    cleanCss = require("gulp-clean-css"),
    SRC_DIR = "./src/",
    LESS_SRC_DIR = "./less/",
    DIST_DIR = "./dist/",
    TEST_DIR = "/test/",
    devMode = false,
    comment = [
        "/**",
        " <%= pkg.description %>, version <%= pkg.version %>",
        "",
        " <%= pkg.description %> is freely distributable under the terms of MIT-style license",
        " Built on DevBridge Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)",
        " For details, see <%= pkg.homepage %>",
        "/\n"
    ].join("\n *");

function buildScript() {
    return gulp
        .src(SRC_DIR + "**/*.js")
        .pipe(gulpif(!devMode, ending({ eolc: "LF" })))
        .pipe(gulpif(!devMode, gulp.dest(SRC_DIR)))
        .pipe(
            rollup({
                input: SRC_DIR + "main.js",
                output: {
                    format: "umd",
                    globals: {
                        jquery: "jQuery"
                    }
                },
                external: ["jquery"]
            })
        )
        .pipe(rename("jquery.suggestions.js"))
        .pipe(banner(comment, { pkg: pkg }))
        .pipe(replace("%VERSION%", pkg.version))
        .pipe(ending({ eolc: "LF" }))
        .pipe(gulp.dest(DIST_DIR + "js"))
        .pipe(uglify({ mangle: true }))
        .pipe(rename("jquery.suggestions.min.js"))
        .pipe(gulp.dest(DIST_DIR + "js"));
}

function buildStyle() {
    return gulp
        .src(LESS_SRC_DIR + "**/*")
        .pipe(gulpif(!devMode, ending({ eolc: "LF" })))
        .pipe(gulpif(!devMode, gulp.dest(LESS_SRC_DIR)))
        .pipe(less({ javascriptEnabled: true }))
        .pipe(gulp.dest(DIST_DIR + "css"))
        .pipe(cleanCss({ compatibility: "ie8" }))
        .pipe(rename("suggestions.min.css"))
        .pipe(gulp.dest(DIST_DIR + "css"));
}

function testPrepare() {
    return gulp
        .src(TEST_DIR + "specs/*.js")
        .pipe(ending())
        .pipe(gulp.dest("test/specs"));
}

function testFull(callback) {
    new karma(
        {
            configFile: __dirname + TEST_DIR + "karma.full.js",
            singleRun: true
        },
        callback
    ).start();
}

function testMinified(callback) {
    new karma(
        {
            configFile: __dirname + TEST_DIR + "karma.minified.js",
            singleRun: true
        },
        callback
    ).start();
}

function setDevMode(callback) {
    devMode = true;
    callback();
}

gulp.task("watch", function() {
    gulp.watch([SRC_DIR + "**/*"], buildScript);
    gulp.watch([LESS_SRC_DIR + "**/*"], buildStyle);
});

exports.build = gulp.series(buildScript, buildStyle);
exports.test = gulp.series(testPrepare, testFull);
exports.testall = gulp.series(exports.test, testMinified);
exports.dev = gulp.series(setDevMode, exports.build, "watch");
exports.default = gulp.series(exports.build, exports.testall);
