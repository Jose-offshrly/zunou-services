export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {},
  testMatch: ['**/__tests__/**/*.test.mjs', '**/*.test.mjs'],
  collectCoverageFrom: [
    'src/**/*.mjs',
    '!src/**/*.test.mjs',
  ],
};
