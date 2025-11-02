# NPM Commands

```bash
npm run dev        # Start development server (use when coding/testing)
npm run build      # Build for production (use to check for build errors)
npm start          # Start production server (use after npm run build)
npm run lint       # Run ESLint (use to check code quality before committing)
npm run type-check # Run TypeScript checking (use to catch type errors)
npm test           # Run API tests (requires server to be running)
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:endpoints # Run endpoint validation tests (requires server running)
```

# Database & Auth Commands

```bash
# Prisma / Supabase
npx prisma generate    # Generate Prisma client (after schema changes)
npx prisma db push     # Push schema changes to Supabase (creates/updates tables)
npx prisma db seed     # Seed database with admin user
npx prisma studio      # Open Prisma Studio GUI to view/edit database

# Environment sync
vercel env pull .env.local  # Pull environment variables from Vercel to local

# Database reset (if needed)
npx prisma db push --force-reset  # ⚠️ Deletes all data and recreates tables
```

# Testing Architecture

## How It's Built
- `tests/endpoint-validation.js` - Node.js script that calls APIs and checks responses
- `tests/api.test.js` - Jest test suite (more complex scenarios) 
- `tests/setup.js` - Jest configuration and test environment setup
- `jest.config.js` - Jest test runner configuration
- `.github/workflows/test.yml` - GitHub CI configuration

## How It Works
**Local:**
1. `npm run dev` - Starts server
2. `npm run test:endpoints` - Runs validation script
3. Script calls APIs and compares actual vs expected response
4. Pass/Fail result

**GitHub CI:**
- Auto-runs on code push
- Same process as local, tests on Node.js 18.x and 20.x

## What Gets Tested
- Route goes through Nord-2-gauche → Est-7-droite
- API endpoints return correct data
- Distance calculations and portal linking work

# Testing Commands

```bash
# Local endpoint testing (requires dev server)
npm run dev                  # Terminal 1: Start server
npm run test:endpoints       # Terminal 2: Run endpoint validation

# Full local test suite
npm run dev                  # Terminal 1: Start server  
npm test                     # Terminal 2: Run all Jest tests
npm run test:endpoints       # Terminal 3: Run endpoint validation

# Test specific endpoints manually
curl "http://localhost:3000/api/nether-address?x=-35&z=-31"
curl "http://localhost:3000/api/nearest-portals?x=-100&z=-200&world=overworld"  
curl "http://localhost:3000/api/route?from_place_id=start_village&to_place_id=end_city"
```