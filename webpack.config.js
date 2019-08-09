module.exports = {
  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: { presets: ['@babel/preset-env'] }
    }]
  },
  output: {
    library: 'multiagent',
    libraryTarget: 'umd'
  }
};
