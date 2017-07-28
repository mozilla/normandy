/* eslint-env node */
var path = require("path");
var webpack = require("webpack");
var ConcatSource = require("webpack-sources").ConcatSource;
var LicenseWebpackPlugin = require("license-webpack-plugin");
var BabiliPlugin = require("babili-webpack-plugin");

module.exports = {
  context: __dirname,
  entry: {
    ajv: "./node_modules/ajv/",
    classnames: "./node_modules/classnames/",
    mozjexl: "./node_modules/mozjexl/",
    PropTypes: "./node_modules/prop-types/",
    React: "./node_modules/react/",
    ReactDOM: "./node_modules/react-dom/",
  },
  output: {
    path: path.resolve(__dirname, "vendor/"),
    filename: "[name].js",
    library: "[name]",
    libraryTarget: "this",
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production"),
      },
    }),
    new BabiliPlugin(),
    /**
     * Plugin that appends "this.EXPORTED_SYMBOLS = ["libname"]" to assets
     * output by webpack. This allows built assets to be imported using
     * Cu.import.
     */
    function ExportedSymbols() {
      this.plugin("emit", function(compilation, callback) {
        for (const libraryName in compilation.entrypoints) {
          const assetName = `${libraryName}.js`; // Matches output.filename
          compilation.assets[assetName] = new ConcatSource(
            "/* eslint-disable */", // Disable linting
            compilation.assets[assetName],
            `this.EXPORTED_SYMBOLS = ["${libraryName}"];` // Matches output.library
          );
        }
        callback();
      });
    },
    new LicenseWebpackPlugin({
      pattern: /^(MIT|ISC|MPL.*|Apache.*|BSD.*)$/,
      filename: `LICENSE_THIRDPARTY`,
    }),
  ],
};
