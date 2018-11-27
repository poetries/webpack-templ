const webpack = require('webpack')
const path = require('path')

const devConfig = require('../config').dev
const {
  port,
  hot,
  hotOnly,
  overlay,
  devtool,
  proxy,
  historyApiFallback
} = devConfig

module.exports = {
    devtool,
    devServer: {
      port,
      historyApiFallback,
      hot,
      hotOnly,
      overlay,
      proxy
    },
    plugins: [
      // 模块热更新插件
       new webpack.HotModuleReplacementPlugin(),

       // 输出热更新路径
       new webpack.NamedModulesPlugin()
    ]
}
