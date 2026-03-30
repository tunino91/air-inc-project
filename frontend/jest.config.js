const nextJest = require("next/jest.js");

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

module.exports = createJestConfig(config);
