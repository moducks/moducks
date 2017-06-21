var path = require('path')

module.exports = {
  entry: ['babel-polyfill', './src/main.js'],
  output: {
    path: path.resolve(__dirname, 'build'),
    publicPath: '/assets/',
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, "./src"),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['react', 'es2015'],
            plugins: ['transform-object-rest-spread'],
          },
        },
      },
    ],
  },
}
