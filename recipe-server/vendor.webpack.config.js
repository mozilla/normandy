/* eslint-env node */
/* eslint-disable no-var, func-names, prefer-arrow-callback, prefer-template, comma-dangle */
var BundleTracker = require('webpack-bundle-tracker');
var path = require('path');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');

var production = process.env.NODE_ENV === 'production';

var settings = require('./package.json');

var ignoredVendors = [
  'babel-runtime',
  'font-awesome',
];
var isAllowedVendor = item => ignoredVendors.indexOf(item) === -1;
var compiledVendorList = Object.keys(settings.dependencies).filter(isAllowedVendor);

module.exports = {
  entry: {
    vendor: compiledVendorList,
  },
  node: {
    fs: 'empty',
  },
  output: {
    path: path.resolve('./assets/bundles/'),
    filename: 'vendor.bundle.js',
    library: 'vendorDLL',
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: production,
      DEVELOPMENT: !production,
      process: {
        env: {
          NODE_ENV: production ? '"production"' : '"development"',
        },
      },
    }),
    new BundleTracker({ filename: './webpack-stats-vendor.json' }),
    new webpack.DllPlugin({
      name: 'vendorDLL',
      // This manifest file is referred to by webpack.config's `DllReferencePlugin`,
      // which essentially imports the compiled vendor bundle into our main app.
      path: path.resolve('./assets/bundles/vendor-manifest.json'),
    })
  ].concat(!production ? [] : [
    // Compress the resulting bundled file via simple UglifyJS settings.
    new UglifyJSPlugin({
      parallel: {
        cache: true,
      },
      uglifyOptions: {
        ie8: false,
        ecma: 5,
        mangle: true,
        output: {
          comments: false,
          beautify: false,
        },
        warnings: false
      }
    }),
  ]),
};
