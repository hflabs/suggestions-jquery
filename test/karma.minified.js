module.exports = function(config) {
    config.set({
        browsers: ["PhantomJS"],
        frameworks: [
            "jquery-3.3.1",
            "jasmine-jquery",
            "jasmine",
            "jasmine-sinon"
        ],
        files: [
            "../dist/js/jquery.suggestions.min.js",
            "../dist/css/*.css",
            "helpers/helpers.js",
            "specs/*.js"
        ],
        plugins: ["@metahub/karma-jasmine-jquery", "karma-*"]
    });
};
