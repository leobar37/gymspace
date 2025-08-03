const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          // Add any modules you want to transpile
          '@gluestack-ui/themed',
          '@gluestack-ui/nativewind-utils',
          'nativewind',
          'react-native-css-interop',
          'react-native-svg',
          'react-native-reanimated',
          'lucide-react-native'
        ],
      },
    },
    argv
  );

  // Add alias for react-native to react-native-web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native': 'react-native-web',
    'react-native/Libraries/Utilities/Platform': 'react-native-web/dist/exports/Platform',
  };

  return config;
};
