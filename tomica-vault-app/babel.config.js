module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './components',
            '@hooks': './hooks',
            '@lib': './lib',
            '@constants': './constants',
            '@types': './types',
            '@assets': './assets',
            '@mocks': './mocks'
          },
        },
      ],
    ],
  };
}; 