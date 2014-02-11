module.exports = function(grunt){

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            options: {
                banner: [
                    '/**',
                    ' <%= pkg.description %>, version <%= pkg.version %>',
                    '',
                    ' <%= pkg.description %> is freely distributable under the terms of MIT-style license',
                    ' Built on Ajax Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)',
                    ' For details, see <%= pkg.homepage %>',
                    '/\n'].join('\n *')
            },
            js:{
                options: {
                    mangle: false,
                    beautify: true
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: '*.js',
                    dest: 'dist/'
                }]
            },
            jsmin: {
                options: {
                    mangle: true,
                    beautify: false
                },
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: '*.js',
                    dest: 'dist/',
                    ext: '.min.js'
                }]
            }
        },
        
        concat: {
            options: {
                banner: '<%= uglify.options.banner %>'
            },
            js: {
                expand: true,
                cwd: 'src/',
                src: '*.js',
                dest: 'dist/'
            }
        },
        
        jasmine: {
            js: {
                src: 'src/*.js',
                options: {
                    specs: 'test/specs/*.js',
                    helpers: 'test/helpers/*.js',
                    vendor: 'test/vendor/*.js',
                    outfile: 'test/runner.html',
                    keepRunner: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('build', ['test', 'concat', 'uglify:jsmin']);
    grunt.registerTask('default', ['build']);
};
