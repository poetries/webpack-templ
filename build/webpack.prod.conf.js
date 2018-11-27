const webpack = require('webpack')
const PurifyCssWebpack = require('purifycss-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const HappyPack = require('happypack')
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin")
const smp = new SpeedMeasurePlugin()

const path = require('path')
const glob = require('glob-all')//处理多个路径

const config = require('../config')
const loadMinified = require('./load-minified')

const prodConfig = {
  plugins: [
    new CleanWebpackPlugin(config.paths.distPath,{
      root: __dirname,
      exclude: ['dll/*.*'],
      verbose:  true,
      dry:      false
    }),

    // dll引用 加速编译
    // ...Object.keys(config.dllLibs).map(name => {
    //   return new webpack.DllReferencePlugin({
    //     context: path.resolve(__dirname, '..'),
    //     manifest: require(`./dll/${name}.manifest.json`),
    //   })
    // }),
    //
    // // dll 插入到页面中
    // ...Object.keys(config.dllLibs).map(name => {
    //   return new AddAssetHtmlPlugin({
    //     filepath: require.resolve(path.resolve(`static/js/${name}.dll.js`)),
    //     includeSourcemap: false
    //   })
    // }),

    // https://www.npmjs.com/package/happypack
    new HappyPack({
      loaders: [ 'babel-loader' ]
    }),
    new PurifyCssWebpack({
      paths: glob.sync([
        './*html',
        './src/*js'
      ])
    }),
    new ParallelUglifyPlugin({
      cacheDir: '.cache/',
      uglifyJS: {
        output: {
          comments: false,
          beautify: false
        },
        compress: {
          warnings: false,
          drop_console: true,
          collapse_vars: true,
          reduce_vars: true
        }
      }
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSAssetsPlugin({}),
    new HtmlWebpackPlugin({
      template: config.paths.htmlTmp,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
        // @reference: https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via splitChunks
      // chunksSortMode: 'dependency',
      serviceWorkerLoader: `<script type="text/javascript">${loadMinified(path.join(__dirname,
        './service-worker-prod.js'))}</script>`
    }),
    new ManifestPlugin({
      fileName: 'asset-manifest.json',
    }),
    /*
      @desc: service worker caching, More detailed configuration:
      @reference: https://github.com/goldhand/sw-precache-webpack-plugin
    */
    new SWPrecacheWebpackPlugin({
      cacheId: 'goodsapp', //your-app-name
      filename: 'service-worker.js',
      staticFileGlobs: ['dist/**/*.{js,html,css}'],
      minify: true,
      stripPrefix: 'dist/'
    }),
    /*
      @desc: limit minChunkSize through MinChunkSizePlugin
      @reference: https://webpack.js.org/plugins/min-chunk-size-plugin/
    */
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 30000 // Minimum number of characters (25kb)
    }),
    /*
      @desc: 编译之后，您可能会注意到某些块太小 - 创建更大的HTTP开销，那么您可以处理像这样；
      @reference: https://webpack.js.org/plugins/limit-chunk-count-plugin/
    */
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 10 // Must be greater than or equal to one
      // minChunkSize: 1000
    }),
    // 在编译出现错误时，使用 NoEmitOnErrorsPlugin 来跳过输出阶段;
    new webpack.NoEmitOnErrorsPlugin(),

    new webpack.optimize.ModuleConcatenationPlugin(),

    new webpack.NamedChunksPlugin(),
    new webpack.NamedModulesPlugin()
  ],
  optimization: {
    minimize:true, //启动压缩
    runtimeChunk: {
      name: 'manifest'
    },
    //打包 第三方库
    //打包 公共文件
    splitChunks: {
        cacheGroups: {
            vendor:{//node_modules内的依赖库
                chunks:"all",
                test: /[\\/]node_modules[\\/]/,
                name:"vendor",
                minChunks: 1, //被不同entry引用次数(import),1次的话没必要提取
                maxInitialRequests: 5,
                minSize: 0,
                priority:100,
                // enforce: true?
            },
            common: {// ‘src/js’ 下的js文件
                chunks:"all",
                test:/[\\/]src[\\/]js[\\/]/,//也可以值文件/[\\/]src[\\/]js[\\/].*\.js/,
                name: "common", //生成文件名，依据output规则
                minChunks: 2,
                maxInitialRequests: 5,
                minSize: 0,
                priority:1
            }
        }
    }
  }
}

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin')

  prodConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if(config.build.bundleAnalyzerReport){
  prodConfig.plugins.push(
    new BundleAnalyzerPlugin({
  		//  可以是`server`，`static`或`disabled`。
  		//  在`server`模式下，分析器将启动HTTP服务器来显示软件包报告。
  		//  在“静态”模式下，会生成带有报告的单个HTML文件。
  		//  在`disabled`模式下，你可以使用这个插件来将`generateStatsFile`设置为`true`来生成Webpack Stats JSON文件。
  		analyzerMode: 'server',
  		//  将在“服务器”模式下使用的主机启动HTTP服务器。
  		analyzerHost: '127.0.0.1',
  		//  将在“服务器”模式下使用的端口启动HTTP服务器。
  		analyzerPort: 8888,
  		//  路径捆绑，将在`static`模式下生成的报告文件。
  		//  相对于捆绑输出目录。
  		reportFilename: 'report.html',
  		//  模块大小默认显示在报告中。
  		//  应该是`stat`，`parsed`或者`gzip`中的一个。
  		//  有关更多信息，请参见“定义”一节。
  		defaultSizes: 'parsed',
  		//  在默认浏览器中自动打开报告
  		openAnalyzer: true,
  		//  如果为true，则Webpack Stats JSON文件将在bundle输出目录中生成
  		generateStatsFile: false,
  		//  如果`generateStatsFile`为`true`，将会生成Webpack Stats JSON文件的名字。
  		//  相对于捆绑输出目录。
  		statsFilename: 'stats.json',
  		//  stats.toJson（）方法的选项。
  		//  例如，您可以使用`source：false`选项排除统计文件中模块的来源。
  		//  在这里查看更多选项：https：  //github.com/webpack/webpack/blob/webpack-1/lib/Stats.js#L21
  		statsOptions: null,
  		logLevel: 'info' // 日志级别。可以是'信息'，'警告'，'错误'或'沉默'。
  	})
  )
}

module.exports = config.build.isAnalyzeLoader ? smp.wrap(prodConfig): prodConfig
