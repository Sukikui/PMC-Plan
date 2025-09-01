const fs = require('fs');
const path = require('path');

const placesDir = path.join(__dirname, '../../public/data/places');

function validateImage(imagePath) {
  const imageName = path.basename(imagePath);
  const placeId = imageName.replace(/\.(png|jpg|jpeg|gif)$/, '');
  const placeJsonPath = path.join(placesDir, `${placeId}.json`);

  if (!fs.existsSync(placeJsonPath)) {
    throw new Error(`Image '${imageName}' does not have a corresponding place JSON file. Expected '${placeJsonPath}' to exist.`);
  }
  console.log(`✅ Image '${imageName}' corresponds to an existing place.`);
  return true;
}

// Main logic
if (require.main === module) {
  const changedImages = process.argv.slice(2);

  if (changedImages.length === 0) {
    console.log('No changed images to validate.');
    process.exit(0);
  }

  let allValid = true;
  for (const imagePath of changedImages) {
    try {
      validateImage(imagePath);
    } catch (error) {
      console.error(`❌ Validation failed for ${imagePath}:`, error.message);
      allValid = false;
    }
  }

  if (!allValid) {
    process.exit(1);
  }
}

module.exports = { validateImage };
