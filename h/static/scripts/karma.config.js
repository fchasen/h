'use strict';

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'browserify',
      'mocha',
      'chai',
      'sinon'
    ],

    // list of files / patterns to load in the browser
    files: [
      // Polyfills for PhantomJS
      './karma-phantomjs-polyfill.js',

      // Test setup
      './test/bootstrap.js',

      // Angular directive templates
      '../../templates/client/*.html',

      // Tests
      //
      // Karma watching is disabled for these files because they are
      // bundled with karma-browserify which handles watching itself via
      // watchify
      { pattern: '**/*-test.coffee', watched: false, included: true, served: true },
      { pattern: '**/*-test.js', watched: false, included: true, served: true }
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      './karma-phantomjs-polyfill.js': ['browserify'],
      './test/bootstrap.js': ['browserify'],
      '**/*-test.js': ['browserify'],
      '**/*-test.coffee': ['browserify'],
    },

    browserify: {
      debug: true,
      extensions: ['.coffee'],
      noParse: [require.resolve('./vendor/katex')],
      configure: function (bundle) {
        bundle
          .transform('coffeeify')
          .plugin('proxyquire-universal')
          // fix for Proxyquire in PhantomJS 1.x.
          // See https://github.com/bitwit/proxyquireify-phantom-menace
          .require(require.resolve('phantom-ownpropertynames/implement'),
            {entry: true});
      }
    },

    mochaReporter: {
      // Display a helpful diff when comparing complex objects
      // See https://www.npmjs.com/package/karma-mocha-reporter#showdiff
      showDiff: true,
      // Only show the total test counts and details for failed tests
      output: 'minimal',
    },

    // Use https://www.npmjs.com/package/karma-mocha-reporter
    // for more helpful rendering of test failures
    reporters: ['mocha'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],
    browserNoActivityTimeout: 20000, // Travis is slow...

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Log slow tests so we can fix them before they timeout
    reportSlowerThan: 500,
  });
};
