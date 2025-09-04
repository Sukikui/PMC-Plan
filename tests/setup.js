// Global test setup for API unit tests
// These tests call API handlers directly, no server needed

beforeAll(async () => {
  console.log('🧪 Setting up API unit tests...');
  console.log('📁 Tests use mock data from existing JSON files');
  
  // Set test environment variables if needed
  process.env.NODE_ENV = 'test';
});