// Frontend unit tests (npm test). next/jest compiles JSX with Next's own compiler and loads .env files.
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
});
