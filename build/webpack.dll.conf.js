const path = require('path')
const webpack = require('webpack')
const chalk = require('chalk')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const config = require('../config')

module.exports = {
  mode: 'production',
  entry: config.dllLibs,
  output: {
    path: config.paths.dllDistPath,
    filename: '[name].dll.js',
    library: '[name]_library'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    minimize:true
  },
  plugins: [
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSAssetsPlugin({}),
    /*
      @desc: https://webpack.js.org/plugins/module-concatenation-plugin/
      "作用域提升(scope hoisting)",使代码体积更小[函数申明会产生大量代码](#webpack3)
    */
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.DllPlugin({
      path: path.join(__dirname, '.', 'dll/[name].manifest.json'),
      name: '[name]_library'
    }),
    new ProgressBarPlugin({
      format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)'
    }),
  ]
}
