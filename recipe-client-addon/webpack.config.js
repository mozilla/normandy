/* eslint-env node */
var path = require("path");
var ConcatSource = require("webpack-sources").ConcatSource;

/**
 * Create a webpack config object for a library. The compiled library will be
 * output to the vendor directory.
 *
 * @param {String} name
 *   Library name. This generally should match the name used on npm.
 * @param {String} entryPoint
 *   Path to the entry point of the library. Webpack can handle directories with
 *   a package.json file, so normally this is "./node_modules/libname".
 */
function libraryConfig(name, entryPoint) {
  return {
    context: __dirname,
    entry: {
      [name]: entryPoint,
    },
    output: {
      path: path.resolve(__dirname, "vendor/"),
      filename: "[name].js",
      library: name,
      libraryTarget: "this",
    },
    plugins: [
      /**
       * Plugin that appends "this.EXPORTED_SYMBOLS = ["libname"]" to assets
       * output by webpack. This allows built assets to be imported using
       * Cu.import.
       */
      function ExportedSymbols() {
        this.plugin("emit", function(compilation, callback) {
          const assetName = `${name}.js`;
          compilation.assets[assetName] = new ConcatSource(
            compilation.assets[assetName],
            `this.EXPORTED_SYMBOLS = ["${name}"];`
          );
          callback();
        });
      },
    ],
  };
}

module.exports = [
  libraryConfig("mozjexl", "./node_modules/mozjexl"),
];
