var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');

module.exports = {
  context: __dirname,
  entry: './selfrepair/static/js/index',
  output: {
      path: path.resolve('static/js/bundles/'),
      filename: "selfrepair-[hash].js"
  },

  plugins: [
    new BundleTracker({filename: './webpack-stats.json'})
  ],

  module: {
    loaders: [
      { test: /\.js?$/, exclude: /node_modules/, loader: 'babel', 'query': {
        presets: ['es2015']}
      },
    ],
},
}
