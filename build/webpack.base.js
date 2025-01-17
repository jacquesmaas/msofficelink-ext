const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const GenerateJSON = require('generate-json-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GenerateLocaleJsonPlugin = require('../plugins/GenerateLocaleJsonPlugin');
const { cssLoaders, htmlPage } = require('./tools');

const rootDir = path.resolve(__dirname, '..');

let resolve = dir => path.join(rootDir, 'src', dir);

module.exports = {
  entry: {
    popup: resolve('./popup'),
    content: resolve('./content'),
    history: resolve('./history'),
    background: resolve('./background')
  },
  output: {
    path: path.join(rootDir, 'dist'),
    publicPath: '/',
    filename: 'js/[name].js',
    chunkFilename: 'js/[id].[name].js?[hash]',
    library: '[name]'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [path.join(rootDir, 'src')],
        options: { formatter: require('eslint-friendly-formatter') }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          extractCSS: true,
          loaders: {
            ...cssLoaders({ extract: true }),
            js: { loader: 'babel-loader' }
          },
          transformToRequire: {
            video: 'src',
            source: 'src',
            img: 'src',
            image: 'xlink:href'
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.join(rootDir, 'src'),
          // https://github.com/sagalbot/vue-select/issues/71#issuecomment-229453096
          path.join(rootDir, 'node_modules', 'element-ui', 'src', 'utils')
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'img/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'media/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          // name: 'fonts/[name].[hash:7].[ext]'
          name: 'fonts/[name].[ext]'
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(['*'], { root: path.join(rootDir, 'dist') }),
    // Customize your extension structure.
    htmlPage('popup', 'popup', ['manifest', 'vendor', 'popup']),
    htmlPage('Favorites & History', 'history', ['manifest', 'vendor', 'history']),
    htmlPage('background', 'background', ['manifest', 'vendor', 'background']),
    // End customize
    new CopyWebpackPlugin([{ from: path.join(rootDir, 'static') }]),
    new GenerateLocaleJsonPlugin({
      _locales: path.join(rootDir, 'src', '_locales')
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function(module) {
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(path.join(__dirname, '../node_modules')) === 0
        );
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor']
    }),
    new GenerateJSON('manifest.json', require('../src/manifest'))
  ],
  performance: { hints: false }
};
