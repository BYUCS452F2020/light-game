const path = require('path');
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './client/src/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js' ]
  },
  output: {
    path: path.resolve(__dirname, '../public'),
    publicPath: '/',
    filename: 'bundle.js', //Creates in-memory bundle for "index.html" to pickup
},
plugins: [
  new webpack.EnvironmentPlugin(['SERVER_HOST'])
],
  // For dev webpack stuff
  devServer: {
    host: 'localhost',
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, '../public'),
    open: false, // Here
    openPage: 'login', // And here
  },
  devtool: 'cheap-module-source-map'

};