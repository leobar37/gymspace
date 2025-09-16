module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        jsxImportSource: 'nativewind',
      }],
      'nativewind/babel'
    ],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@lib': './src/lib'
        }
      }],
      // Explicitly add the new worklets plugin for Reanimated v4
      'react-native-worklets/plugin'
    ]
  };
};