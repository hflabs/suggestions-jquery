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
                    ' Built on DevBridge Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)',
                    ' For details, see <%= pkg.homepage %>',
                    '/\n'].join('\n *')
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
                    dest: 'dist/js/',
                    rename: function (dest, src) {
                        return dest + src.replace(/.js$/, '.min.js');
                    }
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
                dest: 'dist/js/'
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
        },

        less: {
            js: {
                expand: true,
                cwd: 'less/',
                src: '*.less',
                dest: 'dist/css/',
                ext: '.css'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('test', ['jasmine']);
    grunt.registerTask('build', ['test', 'less', 'concat', 'uglify:jsmin']);
    grunt.registerTask('default', ['build']);
};
