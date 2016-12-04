module.exports = function (grunt) {
    grunt.initConfig({
        browserify: {
            client: {
                src: ['client/client.js'],
                dest: 'main.js',
                options: {
                    require: ['jquery']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.registerTask('default', ['browserify']);

};