'use strict';
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var globule = require('globule');
var shelljs = require('shelljs');

var ArchetypeJekyllGenerator = module.exports = function ArchetypeJekyllGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  var dependenciesInstalled = ['bundle', 'ruby'].every(function (depend) {
    return shelljs.which(depend);
  });

  // Exit if Ruby dependencies aren't installed
  if (!dependenciesInstalled) {
    console.log('Looks like you\'re missing some dependencies.' +
      '\nMake sure ' + chalk.white('Ruby') + ' and the ' + chalk.white('Bundler gem') + ' are installed, then run again.');
    shelljs.exit(1);
  }

  // Get static info for templating
  this.appname = path.basename(process.cwd());
  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
  this.gitInfo = {
    name: this.user.git.username,
    email: this.user.git.email,
    github: shelljs.exec('git config github.user', {silent: true}).output.replace(/\n/g, ''),
  };

  this.on('end', function () {
    // Clean up temp files
    spawn('rm', ['-r', '.jekyll'], { stdio: 'inherit' });

    // Install Grunt and Bower dependencies
    this.installDependencies({ skipInstall: options['skip-install'] });
  });
};

util.inherits(ArchetypeJekyllGenerator, yeoman.generators.Base);

// User input
ArchetypeJekyllGenerator.prototype.askForUser = function askForUser() {
  var cb = this.async();

  console.log(this.yeoman);
  console.log(chalk.yellow.bold('This generator will scaffold and wire a Jekyll site with Archetype. Yo, Jekyll-Archetype!') +
    chalk.yellow('\n\nTell us a little about yourself.') + ' ☛');

  var prompts = [{
    name: 'author',
    message: 'Name',
    default: this.gitInfo.name
  },
  {
    name: 'email',
    message: 'Email',
    default: this.gitInfo.email
  },
  {
    name: 'github',
    message: 'GitHub username',
    default: this.gitInfo.github
  },
  {
    name: 'twitter',
    message: 'Twitter username',
    default: '@' + this.gitInfo.github
  }];

  this.prompt(prompts, function (props) {

    this.author  = props.author;
    this.email   = props.email;
    this.github  = props.github;
    this.twitter = props.twitter[0] === '@' ? props.twitter.substr(1) : props.twitter;

    cb();
  }.bind(this));
};

ArchetypeJekyllGenerator.prototype.askForStructure = function askForStructure() {
  var cb = this.async();

  console.log(chalk.yellow('\nSet up some directories.') + ' ☛' +
    '\nNested directories are fine.');

  var slashFilter = function (input) {
    return input.replace(/^\/*|\/*$/g, '');
  };

  var prompts = [{
    name: 'cssDir',
    message: 'CSS directory',
    default: 'css',
    filter: slashFilter
  },
  {
    name: 'jsDir',
    message: 'Javascript directory',
    default: 'js',
    filter: slashFilter
  },
  {
    name: 'imgDir',
    message: 'Image directory',
    default: 'images',
    filter: slashFilter
  },
  {
    name: 'fontsDir',
    message: 'Webfont directory',
    default: 'fonts',
    filter: slashFilter
  },
  {
    name: 'cssPreDir',
    message: 'CSS preprocessor directory',
    default: 'sass',
    filter: slashFilter
  }];


  this.prompt(prompts, function (props) {

    this.cssDir    = props.cssDir;
    this.jsDir     = props.jsDir;
    this.imgDir    = props.imgDir;
    this.fontsDir  = props.fontsDir;
    this.cssPreDir = props.cssPreDir;

    cb();
  }.bind(this));
};

ArchetypeJekyllGenerator.prototype.askForTemplates = function askForTemplates() {
  var cb = this.async();

  console.log(chalk.yellow('\nChoose a template.') + ' ☛');

  var prompts = [{
    name: 'templateType',
    type: 'list',
    message: 'Site template',
    choices: ['Default Jekyll', 'HTML5 ★ Boilerplate']
  }];

  this.prompt(prompts, function (props) {

    if (props.templateType === 'Default Jekyll') {
      this.templateType = 'default';
    }
    else if (props.templateType === 'HTML5 ★ Boilerplate') {
      this.templateType = 'h5bp';
    }

    cb();
  }.bind(this));
};

ArchetypeJekyllGenerator.prototype.askForh5bp = function askForh5bp() {
  if (this.templateType === 'h5bp') {
    var cb = this.async();

    var prompts = [{
      name: 'h5bpJs',
      type: 'confirm',
      message: 'Add H5★BP javascript files?',
    },
    {
      name: 'h5bpIco',
      type: 'confirm',
      message: 'Add H5★BP favorite and touch icons?'
    },
    {
      name: 'h5bpDocs',
      type: 'confirm',
      message: 'Add H5★BP documentation?'
    },
    {
      name: 'h5bpAnalytics',
      type: 'confirm',
      message: 'Include Google Analytics?'
    }];

    this.prompt(prompts, function (props) {

      //this.h5bpCss       = props.h5bpCss;
      this.h5bpJs        = props.h5bpJs;
      this.h5bpIco       = props.h5bpIco;
      this.h5bpDocs      = props.h5bpDocs;
      this.h5bpAnalytics = props.h5bpAnalytics;

      cb();
    }.bind(this));
  }
  else {
    //this.h5bpCss       = false;
    this.h5bpJs        = false;
    this.h5bpIco       = false;
    this.h5bpDocs      = false;
    this.h5bpAnalytics = false;
  }
};

ArchetypeJekyllGenerator.prototype.askForJekyll = function askForJekyll() {
  var cb = this.async();

  console.log(chalk.yellow('\nAnd finally, configure Jekyll.') + ' ☛' +
              '\nYou can change all of these options in _config.yml.');

  var prompts = [{
    name: 'jekDescript',
    message: 'Site description'
  },
  {
    name: 'jekPost',
    type: 'list',
    message: 'Post permalink style',
    choices: ['date', 'pretty', 'none']
  },
  {
    name: 'jekMkd',
    type: 'list',
    message: 'Markdown library',
    choices: ['redcarpet', 'maruku', 'rdiscount', 'kramdown']
  },
  {
    name: 'jekPyg',
    type: 'confirm',
    message: 'Use the Pygments code highlighting library?'
  },
  {
    name: 'jekPage',
    message: 'Number of posts to show on the home page',
    default: 'all',
    validate: function (input) {
      if (/^[0-9]*$/.test(input)) {
        return true;
      }
      if (/^all*$/i.test(input)) {
        return true;
      }
      return 'Must be a number or \'all\'';
    }
  }];

  this.prompt(prompts, function (props) {

    this.jekPyg      = props.jekPyg;
    this.jekMkd      = props.jekMkd;
    this.jekPost     = props.jekPost;
    this.jekDescript = props.jekDescript;
    this.jekPage     = /^all$/i.test(props.jekPage) ? false : props.jekPage;

    cb();
  }.bind(this));
};

// Generate App
ArchetypeJekyllGenerator.prototype.rubyDependencies = function rubyDependencies() {
  this.template('Gemfile');
  this.conflicter.resolve(function (err) {
    if (err) {
      return this.emit('error', err);
    }
    shelljs.exec('bundle install');
  });
};

ArchetypeJekyllGenerator.prototype.git = function git() {
  this.template('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

ArchetypeJekyllGenerator.prototype.gruntfile = function gruntfile() {
  this.template('Gruntfile.js');
};

ArchetypeJekyllGenerator.prototype.packageJSON = function packageJSON() {
  this.template('_package.json', 'package.json');
};

ArchetypeJekyllGenerator.prototype.bower = function bower() {
  this.copy('bowerrc', '.bowerrc');
  this.template('_bower.json', 'bower.json');
};

ArchetypeJekyllGenerator.prototype.jshint = function jshint() {
  this.copy('jshintrc', '.jshintrc');
};

ArchetypeJekyllGenerator.prototype.csslint = function csslint() {
  this.template('csslintrc', '.csslintrc');
};

ArchetypeJekyllGenerator.prototype.editor = function editor() {
  this.copy('editorconfig', '.editorconfig');
};

ArchetypeJekyllGenerator.prototype.jekyllInit = function jekyllInit() {

  // Create the default Jekyll site in a temp folder
  this.jekTmpDir = path.join(process.cwd(), '.jekyll');
  shelljs.exec('bundle exec jekyll new ' + this.jekTmpDir);
};

ArchetypeJekyllGenerator.prototype.templates = function templates() {

  // Format date for posts
  var date = new Date();
  var formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);

  // Scaffold App directories
  this.mkdir('app/_layouts');
  this.mkdir('app/_posts');
  this.mkdir('app/_includes');
  this.mkdir('app/_plugins');
  this.mkdir(path.join('app', this.cssDir));
  this.mkdir(path.join('app', this.cssPreDir));
  this.mkdir(path.join('app', this.jsDir));
  this.mkdir(path.join('app', this.imgDir));
  this.mkdir(path.join('app', this.fontsDir));

  // Jekyll config files
  this.copy('_config.build.yml', '_config.build.yml');
  this.template('_config.yml');

  // Project posts
  this.copy(path.join(this.jekTmpDir, '_posts', formattedDate + '-welcome-to-jekyll.markdown'), path.join('app/_posts', formattedDate + '-welcome-to-jekyll.md'));
  this.template('app/_posts/yo-jekyllrb.md', 'app/_posts/' + formattedDate + '-yo-jekyllrb.md');

  // Jekyll default template
  if (this.templateType === 'default') {

    // Default Jekyll files
    this.copy(path.join(this.jekTmpDir, 'index.html'), 'app/index.html');
    this.copy(path.join(this.jekTmpDir, '_layouts/post.html'), 'app/_layouts/post.html');
    //this.copy(path.join(this.jekTmpDir, 'css/main.css'), path.join('app', this.cssDir, 'main.css'));

    // Jekyll files tailored for Yeoman
    this.template('conditional/template-default/_layouts/default.html', 'app/_layouts/default.html');
    // Empty file for Usemin defaults
    this.write(path.join('app', this.jsDir, 'main.js'), '');
  }

  // HTML5 Boilerplate template
  else if (this.templateType === 'h5bp') {
    var cb = this.async();

    // H5BP files tailored for Yeoman and Jekyll
    this.copy('conditional/template-h5bp/index.html', 'app/index.html');
    this.copy('conditional/template-h5bp/_layouts/post.html', 'app/_layouts/post.html');
    this.template('conditional/template-h5bp/humans.txt', 'app/humans.txt');
    this.template('conditional/template-h5bp/_includes/scripts.html', 'app/_includes/scripts.html');
    this.template('conditional/template-h5bp/_layouts/default.html', 'app/_layouts/default.html');

    // Google analytics include
    if (this.h5bpAnalytics) {
      this.copy('conditional/template-h5bp/_includes/googleanalytics.html', 'app/_includes/googleanalytics.html');
    }

    // Pull H5BP in from Github
    // Use a pre-release commit because there's so much good stuff in it.
    this.remote('h5bp', 'html5-boilerplate', '23f5e084e559177b434f702ff6be1d83e66374d3', function (err, remote) {
      if (err) {
        return cb(err);
      }

      // Always include files
      remote.copy('.htaccess', 'app/.htaccess');
      remote.copy('404.html', 'app/404.html');
      remote.copy('crossdomain.xml', 'app/crossdomain.xml');
      remote.copy('LICENSE.md', 'app/_h5bp-docs/LICENSE.md');
      remote.copy('robots.txt', 'app/robots.txt');

      // CSS boilerplate
    /*  if (this.h5bpCss) {
        remote.copy('css/main.css', path.join('app', this.cssDir, 'main.css'));
      }
      else {*/
        // Empty file
        //this.write(path.join('app', this.cssDir, 'main.css'), '');
     /* }*/

      // Js boilerplate
      // Vendor javascript is handled by Bower
      if (this.h5bpJs) {
        remote.copy('js/main.js', path.join('app', this.jsDir, 'main.js'));
        remote.copy('js/plugins.js', path.join('app', this.jsDir, 'plugins.js'));
      }
      else {
        // Empty file
        this.write(path.join('app', this.jsDir, 'main.js'), '');
      }

      // Touch and favicon
      if (this.h5bpIco) {
        remote.copy('apple-touch-icon-144x144-precomposed.png', 'app/apple-touch-icon-precomposed.png');
        remote.copy('favicon.ico', 'app/favicon.ico');
      }

      // Docs
      if (this.h5bpDocs) {
        remote.directory('doc', 'app/_h5bp-docs/code-docs');
        remote.copy('CHANGELOG.md', 'app/_h5bp-docs/CHANGELOG.md');
        remote.copy('CONTRIBUTING.md', 'app/_h5bp-docs/CONTRIBUTING.md');
        remote.copy('README.md', 'app/_h5bp-docs/README.md');
      }

      cb();
    }.bind(this));
  }
};

ArchetypeJekyllGenerator.prototype.pygments = function pygments() {

  // Pygments styles
  if (this.jekPyg) {
    this.copy(path.join(this.jekTmpDir, 'css/syntax.css'), path.join('app', this.cssDir, 'syntax.css'));
  }
};

ArchetypeJekyllGenerator.prototype.archetype = function app() { 
  var cb = this.async();

  // Get Archetype and provide a "remote" object as a facade API
  this.remote('kwaledesign', 'Archetype', function(err, remote) {
    if (err) {
      return cb(err);
    }
    
    // Get config.rb file from templates/ 
    // (not done remotely to allow lo-dash template for directory names)
    this.template('_config.rb', 'app/config.rb');

    // Archetype screen.scss
    remote.template('sass/screen.scss', path.join('app', this.cssPreDir, 'screen.scss'));  

    // Archetype Base
    remote.directory('sass/base/', path.join('app', this.cssPreDir, 'base')); 
    // Archetype Objects  
    remote.directory('sass/objects/', path.join('app', this.cssPreDir, 'objects')); 
    // Archetype Components
    remote.directory('sass/components/', path.join('app', this.cssPreDir, 'components')); 
    // Archetype Layout
    remote.directory('sass/layout/', path.join('app', this.cssPreDir, 'layout')); 
    // Archetype Temp
    remote.directory('sass/temp/', path.join('app', this.cssPreDir, 'temp')); 

    // Archetype Docs (Styleguide and Pattern Library powered by Dexy)
    remote.directory('docs', 'app/docs');

    cb(); 
  }.bind(this));
};

ArchetypeJekyllGenerator.prototype.styledocs = function templates() {
  var cb = this.async();
 
  // Get Style-Docs and provide a "remote" object as a facade API
  this.remote('kwaledesign', 'Style-Docs', '1.0.2', function (err, remote) {
    if (err) {
      return cb(err);
    }


    // Style-Docs Template Files (Jekyll Pages)
    remote.copy('templates/brandguidelines.html', 'app/brandguidelines.html');
    remote.copy('templates/cuti.html', 'app/cuti.html');
    remote.copy('templates/grid.html', 'app/grid.html');
    remote.copy('templates/performance.html', 'app/performance.html');
    remote.copy('templates/prototype.html', 'app/prototype.html');
    remote.copy('templates/specification.html', 'app/specification.html');
    remote.copy('templates/structured-content.html', 'app/structured-content.html');
    remote.copy('templates/styletile.html', 'app/styletile.html');
    remote.copy('templates/content-reference-wireframe.html', 'app/content-reference-wireframe.html');
    remote.copy('templates/about.html', 'app/about.html');

    // Style-Docs _includes Directories
    remote.directory('_includes/markup', path.join('app/_includes', 'markup'));
    remote.directory('_includes/markdown', path.join('app/_includes', 'markdown'));

    // Grab README.md file and convert to about.md
    remote.copy('README.md', 'app/_includes/markdown/about.md');

    // Style-Docs Sass Files
    remote.template('sass/style-docs.scss', 'app/sass/style-docs.scss');
    remote.directory('sass/style-docs', 'app/sass/style-docs');

    // Style-Docs JavaScript Files
    remote.template('js/annotation.js', 'app/js/annotation.js');
    remote.template('js/performance.js', 'app/js/performance.js');
    remote.template('js/screenshots.js', 'app/js/sreenshots.js');

    cb();
  }.bind(this));
};

