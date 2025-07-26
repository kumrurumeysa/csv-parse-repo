// Test setup file
process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.AWS_REGION = 'eu-central-1';
process.env.S3_BUCKET = 'test-bucket';
process.env.SHARED_DIR = '/tmp/shared';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 