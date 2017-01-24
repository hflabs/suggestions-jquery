module.exports = function(config) {
    config.set({
        browsers: ['PhantomJS'],
        frameworks: ['jquery-1.9.1', 'jasmine-jquery', 'jasmine', 'jasmine-sinon'],
        files: [
            '../dist/js/jquery.suggestions.js',
            '../dist/css/*.css',
            'helpers/helpers.js',
            'specs/*.js',
        ]
    });
};