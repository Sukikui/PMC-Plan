// Global test setup

// Setup before all tests
beforeAll(async () => {
  // Use existing development server on port 3000
  // Make sure to run 'npm run dev' before running tests
  console.log('Using existing Next.js server on port 3000...');
  console.log('Make sure to start the dev server with: npm run dev');
  
  // Set base URL for tests to use existing server
  process.env.TEST_BASE_URL = 'http://localhost:3000';
  
  // Test server connection
  try {
    const testResponse = await fetch('http://localhost:3000/api/nether-address?x=0&z=0');
    if (!testResponse.ok) {
      throw new Error(`Server test failed with status: ${testResponse.status}`);
    }
    console.log('✅ Server connection test passed');
  } catch (error) {
    console.error('❌ Server connection test failed. Make sure to run "npm run dev" first.');
    console.error('Error:', error.message);
    throw error;
  }
});

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}