var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  context: __dirname,

  entry: {
    selfrepair: './normandy/selfrepair/static/js/self_repair_runner',
    control: [
      './normandy/control/static/control/js/index',
      './normandy/control/static/control/admin/sass/control.scss',
      './node_modules/font-awesome/scss/font-awesome.scss',
    ]
  },

  output: {
      path: path.resolve('./assets/bundles/'),
      filename: '[name]-[hash].js',
      chunkFilename: '[id].bundle.js'
  },

  plugins: [
    new BundleTracker({ filename: './webpack-stats.json' }),
    new ExtractTextPlugin('[name]-[hash].css'),
  ],

  module: {
    loaders: [
      {
        test: /(\.|\/)(jsx|js)$/,
        exclude: /node_modules/,
        loader: 'babel',
        'query': {
          presets: ['es2015', 'react', 'stage-2']
        }
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss!sass?sourceMap')
      },
      {
        test: /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'file-loader'
      }
    ],
  }
}
