const assert = require('assert');

// Import fetch for Node.js versions that don't have it built-in
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    fetch = require('node-fetch');
  }
} catch (err) {
  console.error('⚠️  node-fetch not found. Run: npm install node-fetch');
  process.exit(1);
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Expected test results based on our test data
const EXPECTED_RESULTS = {
  'nether-address-nord2-gauche': {
    url: '/api/nether-address?x=-35&z=-31',
    expected: {
      address: 'Nord 2 gauche',
      nearestStop: { axis: 'Nord', level: 2 }
    }
  },
  'nether-address-est7-droite': {
    url: '/api/nether-address?x=580&z=45', 
    expected: {
      address: 'Est 7 gauche',
      nearestStop: { axis: 'Est', level: 7 }
    }
  },
  'nether-address-spawn': {
    url: '/api/nether-address?x=-20&z=29',
    expected: {
      address: 'Spawn',
      nearestStop: { axis: 'Spawn', level: null }
    }
  },
  'nearest-portals-start-village': {
    url: '/api/nearest-portals?x=-100&z=-200&world=overworld',
    expected: {
      length: '>= 1',
      firstPortal: {
        id: 'portal_village_start',
        name: 'Portail du Village',
        world: 'overworld'
      }
    }
  },
  'nearest-portals-end-city': {
    url: '/api/nearest-portals?x=4500&z=300&world=overworld',
    expected: {
      length: '>= 1',
      firstPortal: {
        id: 'portal_city_end',
        name: 'Portail de la Cité',
        world: 'overworld'
      }
    }
  },
  'linked-portal-village': {
    url: '/api/linked-portal?x=-120&y=65&z=-220&from_world=overworld',
    expected: {
      id: 'portal_village_start_nether',
      name: 'Portail du Village (Nether)',
      world: 'nether'
    }
  },
  'linked-portal-city': {
    url: '/api/linked-portal?x=4520&y=70&z=280&from_world=overworld',
    expected: {
      id: 'portal_city_end_nether',
      name: 'Portail de la Cité (Nether)', 
      world: 'nether'
    }
  },
  'route-full-journey': {
    url: '/api/route?from_place_id=start_village&to_place_id=end_city',
    expected: {
      player_from: {
        coordinates: { x: -100, y: 65, z: -200 },
        world: 'overworld'
      },
      steps: {
        length: 5,
        types: ['overworld_transport', 'portal', 'nether_transport', 'portal', 'overworld_transport'],
        netherAddresses: ['Nord 2', 'Est 7 gauche']
      }
    }
  }
};

async function validateEndpoint(testName, config) {
  const { url, expected } = config;
  const fullUrl = `${BASE_URL}${url}`;
  
  console.log(`Testing ${testName}: ${url}`);
  
  try {
    const response = await fetch(fullUrl);
    const data = await response.json();
    
    // Check status code
    assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);
    
    // Validate based on test type
    switch (testName) {
      case 'nether-address-nord2-gauche':
      case 'nether-address-est7-droite':
      case 'nether-address-spawn':
        assert(data.address.includes(expected.address.split(' ')[0]), `Address should contain "${expected.address.split(' ')[0]}", got "${data.address}"`);
        assert.strictEqual(data.nearestStop.axis, expected.nearestStop.axis, `Axis mismatch`);
        assert.strictEqual(data.nearestStop.level, expected.nearestStop.level, `Level mismatch`);
        break;
        
      case 'nearest-portals-start-village':
      case 'nearest-portals-end-city':
        assert(Array.isArray(data), 'Response should be an array');
        assert(data.length >= 1, 'Should return at least one portal');
        assert.strictEqual(data[0].id, expected.firstPortal.id, `First portal ID mismatch`);
        assert.strictEqual(data[0].world, expected.firstPortal.world, `First portal world mismatch`);
        assert(typeof data[0].distance === 'number', 'Distance should be a number');
        break;
        
      case 'linked-portal-village':
      case 'linked-portal-city':
        assert(data !== null, 'Should find a linked portal');
        assert.strictEqual(data.id, expected.id, `Portal ID mismatch`);
        assert.strictEqual(data.world, expected.world, `Portal world mismatch`);
        assert(typeof data.distance === 'number', 'Distance should be a number');
        break;
        
      case 'route-full-journey':
        assert.strictEqual(data.player_from.world, expected.player_from.world, 'Player world mismatch');
        assert.strictEqual(data.player_from.coordinates.x, expected.player_from.coordinates.x, 'Player X mismatch');
        assert.strictEqual(data.steps.length, expected.steps.length, `Expected ${expected.steps.length} steps, got ${data.steps.length}`);
        
        // Validate step types
        const stepTypes = data.steps.map(step => step.type);
        expected.steps.types.forEach((expectedType, index) => {
          assert.strictEqual(stepTypes[index], expectedType, `Step ${index} type mismatch`);
        });
        
        // Check that route goes through nether with expected addresses
        const netherSteps = data.steps.filter(step => step.type === 'nether_transport');
        assert(netherSteps.length > 0, 'Route should include nether transport');
        
        // Collect addresses from nether transport steps (both from and to)
        const addresses = [];
        netherSteps.forEach(step => {
          if (step.from && step.from.address) addresses.push(step.from.address);
          if (step.to && step.to.address) addresses.push(step.to.address);
        });
        
        assert(addresses.length > 0, 'Should have nether addresses in transport steps');
        assert(addresses.some(addr => addr.includes('Nord')), 'Should pass through Nord axis');
        assert(addresses.some(addr => addr.includes('Est')), 'Should pass through Est axis');
        break;
    }
    
    console.log(`  ✅ ${testName} passed`);
    
  } catch (error) {
    console.error(`  ❌ ${testName} failed: ${error.message}`);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Running PMC Map API endpoint validation tests...\n');
  
  let passedTests = 0;
  let totalTests = Object.keys(EXPECTED_RESULTS).length;
  
  for (const [testName, config] of Object.entries(EXPECTED_RESULTS)) {
    try {
      await validateEndpoint(testName, config);
      passedTests++;
    } catch (error) {
      console.error(`\nTest failed: ${testName}`);
      console.error(`URL: ${BASE_URL}${config.url}`);
      console.error(`Error: ${error.message}\n`);
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, validateEndpoint, EXPECTED_RESULTS };