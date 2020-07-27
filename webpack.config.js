const path = require('path');

module.exports = {
  entry: './src/index.ts',
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: "umd",
    umdNamedDefine: true
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        use: [
          'ts-loader',
          'source-map-loader'
        ]
      }
    ]

  },


};