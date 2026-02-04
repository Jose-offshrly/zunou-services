module.exports = {
  endOfLine: 'auto',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  overrides: [
    {
      files: '*.js.hbs',
      options: {
        singleQuote: false
      }
    }
  ]
}
