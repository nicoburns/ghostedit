/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> ' +
        'Copyright (c) 2010-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n\n' +
        'Description:       <%= pkg.description %>\n' +
        'Homepage:          <%= pkg.homepage %>\n' +
        'License:           <%= _.pluck(pkg.licenses, "type").join(", ") %>\n' +
        'Author:            <%= pkg.author.name + " <" + pkg.author.email + ">" %>\n' +
        'Version:           <%= pkg.version %>\n' +
        'Release Date:      <%= grunt.template.today("yyyy-mm-dd") %>\n' +
        'Browser Support:   <%= pkg.browsersupport %>\n' +
        '*/'
    },
    lint: {
      files: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
    },
    qunit: {
      files: ['test/**/*.html']
    },
    concat: {
      core: {
        src: ['<banner:meta.banner>', 
                'lib/lasso-<% pkg.dependencies.lasso %>.js', 'src/ghostedit.js', 'src/core/*.js'],
        dest: 'dist/custom/<%= pkg.name %>-core-<%= pkg.version %>.js'
      },
      standard: {
        src: ['<config:concat.core.dest>', 'src/plugins/*.js', 'src/ui/default.js', 'src/ui/standard.js'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },
    min: {
      core: {
        src: ['<banner:meta.banner>', '<config:concat.core.dest>'],
        dest: 'dist/custom/<%= pkg.name %>-core-<%= pkg.version %>.min.js'
      },
      standard: {
        src: ['<banner:meta.banner>', '<config:concat.standard.dest>'],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.min.js'
      },
      defaultui: {
        src: ['<banner:meta.banner>', 'src/ui/default.js'], dest: 'dist/custom/ui/<%= pkg.name %>-defaultui-<%= pkg.version %>.min.js'
      },
      minimalui: {
        src: ['<banner:meta.banner>', 'src/ui/minimal.js'], dest: 'dist/custom/ui/<%= pkg.name %>-minimalui-<%= pkg.version %>.min.js'
      },
      image: {
        src: ['<banner:meta.banner>', 'src/plugins/image.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-image-<%= pkg.version %>.min.js'
      },
      link: {
        src: ['<banner:meta.banner>', 'src/plugins/link.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-link-<%= pkg.version %>.min.js'
      },
      list: {
        src: ['<banner:meta.banner>', 'src/plugins/list.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-list-<%= pkg.version %>.min.js'
      },
      save: {
        src: ['<banner:meta.banner>', 'src/plugins/save.js'], dest: 'dist/custom/plugins/<%= pkg.name %>-save-<%= pkg.version %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {}
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'qunit concat min');

};
