const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { DefinePlugin, IgnorePlugin } = require('webpack');

const paths = require('./paths.js');

module.exports = (env, argv) => ({
  entry: {
    ui: paths.uiIndex,
    plugin: paths.pluginIndex,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpg|gif|webp|svg)$/,
        loader: 'url-loader',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
  output: {
    filename: '[name].js',
    path: paths.appBuild,
    publicPath: '/',
    assetModuleFilename: '[name][ext]',
  },
  plugins: [
    new CleanWebpackPlugin(),
    // The @anthropic-ai/sdk pulls in Node-only code that this Figma plugin never
    // runs: the worker `agent-toolset` (bash/fs/edit tools) and lazy `node:fs`/
    // `node:path` credential-file helpers. Both are reached only via dynamic
    // imports behind unused code paths (the plugin just streams the messages API
    // with a direct apiKey), so ignoring them stops webpack from following those
    // imports into `node:` builtins it can't resolve for the browser sandbox.
    new IgnorePlugin({ resourceRegExp: /agent-toolset|^node:/ }),
    new CaseSensitivePathsPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development'),
      'process.env.USE_TEST_DATA': JSON.stringify(env?.testdata ? 'true' : 'false'),
      'process.env.SHOW_DEBUG': JSON.stringify(env?.debug ? 'true' : 'false'),
    }),
    new HtmlWebpackPlugin({
      template: paths.uiHtml,
      filename: 'ui.html',
      chunks: ['ui'],
      cache: false,
    }),
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/ui\.js$/],
    }),
  ],
});
