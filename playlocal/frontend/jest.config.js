// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: ['<rootDir>/jest.env.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', 'MapView\\.test\\.tsx'],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'text-summary', 'clover', 'json'],

  reporters: [
    'default',
    [
      'jest-junit',
      { outputDirectory: 'coverage/test-results', outputName: 'junit.xml' },
    ],
  ],
};

module.exports = createJestConfig(customJestConfig);
