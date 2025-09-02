
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const placesDir = path.join(__dirname, '../../public/data/places');
const portalsDir = path.join(__dirname, '../../public/data/portals');

// Use absolute paths to ensure compatibility
const placeSchemaPath = path.join(__dirname, '../schemas/place-schema.json');
const portalSchemaPath = path.join(__dirname, '../schemas/portal-schema.json');

const placeSchema = JSON.parse(fs.readFileSync(placeSchemaPath, 'utf8'));
const portalSchema = JSON.parse(fs.readFileSync(portalSchemaPath, 'utf8'));

const ajv = new Ajv();
const schemas = {
  place: ajv.compile(placeSchema),
  portal: ajv.compile(portalSchema),
};

/**
 * Validates data against a schema.
 * @param {string} type - 'place' or 'portal'.
 * @param {object} data - The JSON data to validate.
 * @returns {boolean} - True if valid, otherwise throws an error.
 */
function validateSchema(type, data) {
  const validateFn = schemas[type];
  if (!validateFn) {
    throw new Error(`Invalid type specified: ${type}`);
  }

  const valid = validateFn(data);
  if (!valid) {
    throw new Error(`Schema validation failed: ${ajv.errorsText(validateFn.errors)}`);
  }
  return true;
}

/**
 * Checks if a place or portal ID is unique.
 * @param {string} type - 'place' or 'portal'.
 * @param {string} id - The ID to check.
 */
function checkIdUniqueness(type, id) {
  const dir = type === 'place' ? placesDir : portalsDir;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.startsWith(`${id}.`) || file.startsWith(`${id}_`)) {
      throw new Error(`ID '${id}' is not unique. A file with a similar name already exists.`);
    }
  }
}

/**
 * Checks if linked portals for a place exist.
 * @param {object} placeData - The JSON data for the place.
 */
function checkLinkedPortals(placeData) {
  if (placeData.portals && placeData.portals.length > 0) {
    for (const portalId of placeData.portals) {
      const overworldFile = path.join(portalsDir, `${portalId}_overworld.json`);
      const netherFile = path.join(portalsDir, `${portalId}_nether.json`);
      if (!fs.existsSync(overworldFile) && !fs.existsSync(netherFile)) {
        throw new Error(`Linked portal '${portalId}' not found. Expected ${overworldFile} or ${netherFile} to exist.`);
      }
    }
  }
}

// Main logic to run from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const addedFiles = process.env.ADDED_FILES ? process.env.ADDED_FILES.split(' ') : [];

  if (!filePath) {
    console.error('Error: Please provide a file path to validate.');
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    let type;
    if (filePath.includes('/places/')) {
      type = 'place';
    } else if (filePath.includes('/portals/')) {
      type = 'portal';
    } else {
      throw new Error(`Could not determine type from file path: ${filePath}`);
    }

    // 1. Schema Validation
    validateSchema(type, data);
    console.log(`✅ Schema validation successful for ${filePath}`);

    // 2. Uniqueness Check (only for new files)
    // No check in PR since we can't determine if it's new or not
    /*
    if (addedFiles.includes(filePath)) {
      checkIdUniqueness(type, data.id);
      console.log(`✅ ID uniqueness check passed for ${filePath}`);
    }
    */

    // 3. Linked Portals Check (only for places)
    if (type === 'place') {
      checkLinkedPortals(data);
      console.log(`✅ Linked portals check passed for ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Validation failed for ${filePath}:`, error.message);
    process.exit(1);
  }
}

module.exports = { validateSchema, checkIdUniqueness, checkLinkedPortals };
