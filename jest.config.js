/**
 * Jest Configuration for EVID-DGC
 * 
 * This configuration sets up Jest for testing the Express.js backend
 * with Supertest for HTTP assertions.
 */

module.exports = {
  // Use Node.js environment for backend testing
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ],

  // Files to ignore during testing
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/public/'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds (can be increased as more tests are added)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },

  // Timeout for async operations (10 seconds)
  testTimeout: 10000,

  // Verbose output for better debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Force exit after tests complete (important for server tests)
  forceExit: true,

  // Detect open handles (helps debug hanging tests)
  detectOpenHandles: true
};
