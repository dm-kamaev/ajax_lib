module.exports = {
  'env': {
    es6: true,
    node: true,
    browser: true,
    jquery: false
  },
  'extends': 'eslint:recommended',
  'parserOptions': {
    'ecmaVersion': 9,
    "sourceType": "module",
  },
  'rules': {
    "max-len": [ 2, {
      "code": 200, "tabWidth": 2, 'ignoreComments': true, "ignoreUrls": true } ],
    'indent': [
      'error',
      2,
      {'SwitchCase': 1}
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    "eqeqeq": ["error", "always"],
    'no-extra-boolean-cast': ['off'],
    'no-console': ['off'],
    'no-useless-escape': ['off']
  }
};
