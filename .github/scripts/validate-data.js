
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

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
function validate(type, data) {
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

// Main logic to run from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];

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

    validate(type, data);
    console.log(`✅ Validation successful for ${filePath}`);
  } catch (error) {
    console.error(`❌ Validation failed for ${filePath}:`, error.message);
    process.exit(1);
  }
}

module.exports = { validate };
