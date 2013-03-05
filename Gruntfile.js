module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		// Read 'package.json' file into a variable for later access
		pkg: grunt.file.readJSON('package.json'),

		banner: '/*! <%= pkg.title || pkg.name %> ' +
				'Copyright (c) 2010-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n\n' +
				'Description:       <%= pkg.description %>\n' +
				'Homepage:          <%= pkg.homepage %>\n' +
				'License:           <%= _.pluck(pkg.licenses, "type").join(", ") %>\n' +
				'Author:            <%= pkg.author.name + " <" + pkg.author.email + ">" %>\n' +
				'Version:           <%= pkg.version %>\n' +
				'Release Date:      <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'Browser Support:   <%= pkg.browsersupport %>\n' +
				'*/',
		
		/* TEST */
		jshint: {
			source: ['grunt.js', 'lib/**/*.js', 'src/ghostedit.js', 'src/**/*.js']
		},

		/* BUILD */
		clean: ["dist/"],

		concat: {
			core: {
				src: ['lib/lasso-<%= pkg.dependencies.lasso %>.js', 'src/ghostedit.js',
									'src/core/init.js', 'src/core/plugins.js', 'src/core/util.js', 'src/core/event.js',
									'src/core/dom.js', 'src/core/selection.js', 'src/core/inout.js', 'src/core/history.js',
									'src/core/clipboard.js', 'src/core/textblock.js', 'src/core/container.js'],
				dest: 'dist/<%= pkg.name %>-core-<%= pkg.version %>.js'
			},
			standard: {
				src: ['lib/lasso-<%= pkg.dependencies.lasso %>.js', 'src/ghostedit.js',
									'src/core/init.js', 'src/core/plugins.js', 'src/core/util.js', 'src/core/event.js',
									'src/core/dom.js', 'src/core/selection.js', 'src/core/inout.js', 'src/core/history.js',
									'src/core/clipboard.js', 'src/core/textblock.js', 'src/core/container.js',
									'src/plugins/*.js', 'src/ui/default.js', 'src/ui/minimal.js'],
				dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
			},
			css: {
				src: ['src/ghostedit.css', 'src/ui/default.css'],
				dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.css'
			}
		},

		uglify: {
			options: {
				banner: "<%= banner %>"
			},
			core: {
				src: ['dist/<%= pkg.name %>-core-<%= pkg.version %>.js'],
				dest: 'dist/<%= pkg.name %>-core-<%= pkg.version %>.min.js'
			},
			standard: {
				src: ['dist/<%= pkg.name %>-<%= pkg.version %>.js'],
				dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
			},
			defaultui: {
				src: ['src/ui/default.js'], dest: 'dist/custom/ui/<%= pkg.name %>-defaultui-<%= pkg.version %>.min.js'
			},
			minimalui: {
				src: ['src/ui/minimal.js'], dest: 'dist/custom/ui/<%= pkg.name %>-minimalui-<%= pkg.version %>.min.js'
			},
			image: {
				src: ['src/plugins/image.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-image-<%= pkg.version %>.min.js'
			},
			link: {
				src: ['src/plugins/link.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-link-<%= pkg.version %>.min.js'
			},
			list: {
				src: ['src/plugins/list.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-list-<%= pkg.version %>.min.js'
			},
			save: {
				src: ['src/plugins/save.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-save-<%= pkg.version %>.min.js'
			}
		},
	});

	/* LOAD MODULES */
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	

	/* TASKS */
	//grunt.registerTask("release", "prepare min compass:release");
	grunt.registerTask('default', ['jshint', 'clean', 'concat:core',
										'concat:standard', 'uglify:core', 'uglify:standard']);
	
	grunt.registerTask('full', ['jshint', 'clean', 'concat', 'uglify']);

};