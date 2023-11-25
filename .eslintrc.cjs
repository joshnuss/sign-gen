module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: 'airbnb',
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        '.eslintrc.{js,cjs}'
      ],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    'no-use-before-define': 'off',
    semi: ['error', 'never'],
    'object-curly-newline': 'off',
    'comma-dangle': ['error', 'never'],
    'no-plusplus': 'off'
  }
}
