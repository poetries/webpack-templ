/**
 * 使用middleware搭建服务:更灵活配置,不在使用webpack-dev-server
 * @type {[type]}
 */

const express = require('express')
const webpack = require('webpack')
const opn = require('opn')

const app = express()
const port = 3000

//把express和配置联合起来 需要用到middleware
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const proxyMiddleware = require('http-proxy-middleware')
const historyApiFallback = require('connect-history-api-fallback')

const config = require('./webpack.base.conf')({env:'development'})
const compiler = webpack(config) //给express使用

const proxyTable = require('../config/proxy')

for(let context in proxyTable){
  app.use(proxyMiddleware(context, proxyTable[context]))
}

app.use(historyApiFallback(require('../config/historyfallback')))

app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath
}))

app.use(webpackHotMiddleware(compiler))


app.listen(port, function(){
  console.log('> Ready on:' + port)
  opn('http://localhost:' + port)
})
