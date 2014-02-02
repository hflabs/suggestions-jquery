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
		    ' Depends on Ajax Autocomplete for jQuery (https://github.com/devbridge/jQuery-Autocomplete)',
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
			    dest: 'dest/'
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
			    dest: 'dest/',
			    ext: '.min.js'
			}]
		}
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('build', ['uglify']);
};
