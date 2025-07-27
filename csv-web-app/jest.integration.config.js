module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/integration/**/*.test.js'],
  collectCoverageFrom: [
    'app.js',
    '!**/node_modules/**',
    '!**/test/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 15000,
  verbose: true
}; 