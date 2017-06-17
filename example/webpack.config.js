var path = require("path");
module.exports = {
  entry: ["babel-polyfill", "./main.js"],
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: "/assets/",
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules|es/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['react'],
            plugins: ['transform-object-rest-spread']
          }
        }
      }
    ]
  }
};
