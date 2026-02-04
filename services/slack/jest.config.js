// eslint-disable-next-line no-undef
module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  moduleNameMapper: {
    '^@zunou-graphql/(.+)$': '<rootDir>/../../lib/zunou-graphql/$1',
    '^@zunou-queries/(.+)$': '<rootDir>/../../lib/zunou-queries/$1',
    '^~/(.+)$': '<rootDir>/src/$1',
  },
  preset: 'ts-jest',
  roots: ['.'],
  setupFiles: ['./src/tests/Setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
}
