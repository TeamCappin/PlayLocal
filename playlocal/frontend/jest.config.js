/* eslint-disable @typescript-eslint/no-require-imports */
// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "text-summary", "clover", "json"],

  reporters: [
    "default",
    ["jest-junit", { outputDirectory: "coverage/test-results", outputName: "junit.xml" }],
  ],
};

module.exports = createJestConfig(customJestConfig);
