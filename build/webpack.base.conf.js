const merge = require('webpack-merge')
const webpack = require('webpack')
const path = require('path')

const chalk = require('chalk')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const developmentConfig = require('./webpack.dev.conf')
const productionConfig = require('./webpack.prod.conf')
const svgoConfig = require('../config/svgo-config.json')

const paths = require('../config').paths
const {
  appIndex,
  htmlTmp,
  assetsRoot,
  distPath,
  srcPath,
  assetsPath,
  containersPath,
  componentsPath,
  storePath,
  helperPath,
  nodeModulePath
} = paths

// 根据环境变量生成配置
const generateConfig = devMode =>{

    // https://www.npmjs.com/package/happypack
    // 生产环境加速打包 'happypack/loader'
    const scriptLoader = devMode
        ? [
          'babel-loader'
          // {
          //   loader: 'eslint-loader',
          //   options: {
          //       formatter: require('eslint-friendly-formatter')
          //   }
          // }]
        ]
        :['happypack/loader']

    const cssLoaders = [
      {
          loader: 'css-loader',
          options: {
              importLoaders: 3,
              sourceMap: false
          }
      },
      {
        loader: 'postcss-loader',
        options: {
          ident: 'postcss',
          sourceMap: devMode,
          plugins: [

          ].concat(devMode
            ? []
            : require('postcss-sprites')({
                spritePath: 'dist/assets/imgs/sprites',
                retina: true
              })
          )
        }
      },
      {
          loader: 'less-loader',
          options: {
              sourceMap: devMode
          }
      },
      {
          loader: 'sass-loader',
          options: {
              sourceMap: devMode
          }
      }
    ]

    const styleLoader = devMode
          ? ['style-loader'].concat(cssLoaders)
          : [
             MiniCssExtractPlugin.loader
          ].concat(cssLoaders)

    const fileLoader = devMode
        ? [{
            loader: 'file-loader',
            options: {
              name: '[name]-[hash:5].[ext]',
              outputPath: 'assets/imgs/'
            }
          }]
        : [{
          loader: 'url-loader',
          options: {
            name: '[name]-[hash:5].[ext]',
            limit: 1000,//1k
            outputPath: 'assets/imgs/'
          }
        }]

    return {
      mode: devMode ? 'development':'production',
      entry: {
        app: appIndex
      },
      output: {
        path: distPath,
        filename: 'static/js/[name].[hash:5].js',
        chunkFilename: 'static/js/[name].[hash:8].chunk.js',
        publicPath: '/' //浏览器中访问资源的路径
      },
      // 路径解析
      resolve: {
        extensions: ['.js', '.jsx', '.json'],
        modules: [
          srcPath,
          nodeModulePath
        ],
        alias: {
          '@': srcPath,
          '@assets': assetsPath,
          '@containers': containersPath,
          '@components': componentsPath,
          '@store': storePath,
          '@helper': helperPath
        }
      },
      module: {
          rules: [
              {
                  test: /\.(js|jsx)$/,
                  include: [srcPath],
                  exclude : /node_modules/,
                  use: scriptLoader
              },
              {
                  test: /\.(less|css|scss)$/,
                  use: styleLoader
              },
              {
                test: /\.svg$/,
                enforce: 'pre',
                loader: 'svgo-loader?' + JSON.stringify(svgoConfig),
                include: /assets\/icons/
              },

              {
                test: /\.(png|jpg|jpeg|gif)$/,
                use: fileLoader.concat(devMode
                  ? []
                  : [
                      {
                        loader: 'img-loader',
                        options: {
                          pngquant: {
                            quality: 80
                          }
                        }
                      }
                    ]
                )
              },
              {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                use: fileLoader
              }
          ]
      },
      plugins: [
        new MiniCssExtractPlugin({
    			filename: 'static/css/[name].[hash].css',
    			// chunkFilename:'static/css/[id].[hash].css'
		    }),

        new ProgressBarPlugin({
          format: '  build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)'
        }),
        new HtmlWebpackPlugin({
    			inject: true,
    			template: htmlTmp,
          minify: {
            collapseWhitespace: true
          }
    		}),
        // new webpack.ProvidePlugin({
        //   $: 'jquery'
        // })
      ]
    }
}


module.exports = env =>{
  const devMode = env==='development'
  const config = devMode ? developmentConfig : productionConfig
  return merge(generateConfig(devMode),config)
}
