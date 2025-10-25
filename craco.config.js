module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable CSS minification temporarily
      if (webpackConfig.mode === 'production') {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (minimizer) => {
            return !minimizer.constructor.name.includes('CssMinimizerPlugin');
          }
        );
      }
      return webpackConfig;
    },
  },
};
