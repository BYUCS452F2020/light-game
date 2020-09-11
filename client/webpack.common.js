const path = require('path');
module.exports = {
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
    path: path.resolve(__dirname, '../build/client'),
    publicPath: '/',
    filename: 'bundle.js', //Creates in-memory bundle for "index.html" to pickup
},
  // For dev webpack stuff
  devServer: {
    host: 'localhost',
    historyApiFallback: true,
    contentBase: path.join(__dirname),
    open: false, // Here
    openPage: 'login', // And here
  },
  devtool: 'cheap-module-source-map',
};