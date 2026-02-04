const importPlugin = require('eslint-plugin-import')
const js = require('@eslint/js')
const prettier = require('eslint-config-prettier')
const reactHooksPlugin = require('eslint-plugin-react-hooks')
const reactRecommended = require('eslint-plugin-react/configs/recommended.js')
const simpleImportSortPlugin = require('eslint-plugin-simple-import-sort')
const sortKeysFixPlugin = require('eslint-plugin-sort-keys-fix')
const typescriptParser = require('@typescript-eslint/parser')
const typescriptPlugin = require('@typescript-eslint/eslint-plugin')

const files = [
  '**/*.cjs',
  '**/*.cts',
  '**/*.js',
  '**/*.jsx',
  '**/*.mjs',
  '**/*.mts',
  '**/*.ts',
  '**/*.tsx',
]

const ignores = [
  '**/.prettierrc.cjs',
  '**/.prettierrc.js',
  '**/@generated',
  '**/*.lock',
  '**/build',
  '**/coverage',
  '**/dist',
  '**/eslint.config.cjs',
  '**/eslint.config.js',
  '**/gql',
  '**/jest.config.js',
  '**/out',
  '**/storage',
  '**/tmp',
  '**/vendor-bin',
  '**/vendor',
  '**/vite.config.ts',
  'node_modules',
  'yarn.lock',
  '**/build',
]

const config = [
  {
    ignores,
  },
  js.configs.recommended,
  prettier,
  {
    ...reactRecommended,
    rules: {
      ...reactRecommended.rules,
      'react/jsx-boolean-value': ['error', 'always'],
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      'react/jsx-sort-props': 'error',
      'react/react-in-jsx-scope': 'off',

      /* eslint-disable sort-keys */
      // Disable broken rules.
      'react/require-render-return': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-no-undef': 'off',
      'react/jsx-uses-vars': 'off',
      'react/no-danger-with-children': 'off',
      'react/display-name': 'off',
      'react/no-direct-mutation-state': 'off',
      'react/prop-types': 'off',
      'react/no-string-refs': 'off',
      /* eslint-enable sort-keys */
    },
  },
  {
    files,
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      ...typescriptPlugin.configs['eslint-recommended'].overrides[0].rules,
      ...typescriptPlugin.configs['eslint-recommended'].rules,
      ...typescriptPlugin.configs['strict-type-checked'].rules,
      ...typescriptPlugin.configs['stylistic-type-checked'].rules,
      ...importPlugin.configs.electron.rules,
      ...importPlugin.configs.errors.rules,
      ...importPlugin.configs.react.rules,
      ...typescriptPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      ...importPlugin.configs.warnings.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Disable temporarily, until we have time to fix them.
      // TODO: remove these.
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
    },
    settings: {
      ...importPlugin.configs.typescript.settings,
      'import/resolver': {
        ...importPlugin.configs.typescript.settings['import/resolver'],
        typescript: {
          alwaysTryTypes: true,
          project: './',
        },
      },
    },
  },
  {
    files,
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      'import/default': 'error',
      'import/export': 'error',
      'import/namespace': ['error', { allowComputed: true }],
      'import/no-unresolved': ['error', { amd: true, commonjs: true }],
      'import/no-default-export': 'error',
      /* eslint-disable sort-keys */
      // Disable broken rules.
      'import/default': 'off',
      'import/namespace': 'off',
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
      /* eslint-enable sort-keys */
    },
  },
  {
    files,
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TODO: Re-enable when support has been released (https://github.com/facebook/react/pull/28773)
      // ...reactHooksPlugin.configs.recommended.rules,
      'no-constant-binary-expression': 'error',
      semi: ['error', 'never'],
      'sort-keys': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    plugins: {
      'sort-keys-fix': sortKeysFixPlugin,
    },
    rules: {
      'sort-keys-fix/sort-keys-fix': 'warn',
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
]

module.exports = config
