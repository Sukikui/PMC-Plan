const fs = require('fs');
const { validateSchema, checkIdUniqueness, checkLinkedPortals } = require('./validate-data.js');

/**
 * Validates issue data based on labels (place or portal) and generates a pull request.
 * @param {object} github - The GitHub object.
 * @param {object} context - The GitHub Actions context object.
 */
async function validateIssueData(github, context) {
    const issueBody = context.payload.issue.body;
    const isPlace = context.payload.issue.labels.some(label => label.name === 'place');
    const isPortal = context.payload.issue.labels.some(label => label.name === 'portal');

    if (!isPlace && !isPortal) {
        console.log('❌ Issue must be labeled as either place or portal');
        return;
    }

    let extractedData;
    try {
        extractedData = extractDataFromTemplate(issueBody, isPlace, isPortal);
        console.log('Extracted data:', extractedData);
    } catch (error) {
        console.log('❌ Failed to extract data from template:', error.message);
        await addErrorComment(github, context, error.message);
        return;
    }

    const { generatePlaceJson, generatePortalJson } = require('./generate-json.js');
    let jsonData;

    if (isPlace) {
        jsonData = generatePlaceJson(extractedData);
    } else if (isPortal) {
        jsonData = generatePortalJson(extractedData);
    }

    console.log('Generated JSON:', JSON.stringify(jsonData, null, 2));

    try {
        const type = isPlace ? 'place' : 'portal';
        validateSchema(type, jsonData);
        console.log('✅ Schema validation passed');

        checkIdUniqueness(type, jsonData.id);
        console.log('✅ ID uniqueness verified');

        if (isPlace) {
            checkLinkedPortals(jsonData);
            console.log('✅ All linked portals exist');
        }

        if (isPlace && extractedData.image && extractedData.image.trim()) {
            console.log('🖼️ Image field is present, fetching issue as HTML to get image URL...');
            try {
                const issueResponse = await github.request({
                    url: context.payload.issue.url,
                    headers: {
                        accept: 'application/vnd.github.v3.html+json'
                    }
                });
                const issueBodyHtml = issueResponse.data.body_html;
                console.log('📄 Fetched HTML body of the issue.');
                console.log(issueBodyHtml.substring(0, 500));

                const imageUrlMatch = issueBodyHtml.match(/<img[^>]+src="([^"]+)"/);

                if (imageUrlMatch && imageUrlMatch[1]) {
                    const imageUrl = imageUrlMatch[1];
                    console.log(`✅ Found image URL in HTML body: ${imageUrl}`);
                    await handleImageDownload(github, context, imageUrl, jsonData.id);
                    console.log('✅ Image download and validation completed');
                } else {
                    console.log('⚠️ Could not find image URL in HTML body. Regex did not match.');
                }
            } catch (error) {
                console.log('⚠️ Image processing failed:', error.message);
            }
        }

        await generateFilesAndCreatePR(github, context, jsonData, isPlace, isPortal);
        await addSuccessComment(github, context);

    } catch (error) {
        console.log('❌ Validation failed:', error.message);
        await addErrorComment(github, context, error.message);
    }
}

/**
 * Generates files and creates a pull request.
 * @param {object} github - The GitHub object.
 * @param {object} context - The GitHub Actions context object.
 * @param {object} jsonData - The JSON data for the place or portal.
 * @param {boolean} isPlace - True if the data is for a place, false otherwise.
 * @param {boolean} isPortal - True if the data is for a portal, false otherwise.
 */
async function generateFilesAndCreatePR(github, context, jsonData, isPlace, isPortal) {
    const branchName = `add-${isPlace ? 'place' : 'portal'}/${jsonData.id}`;

    try {
        console.log('🚀 Starting automatic PR creation...');

        const { data: repo } = await github.rest.repos.get({
            owner: context.repo.owner,
            repo: context.repo.repo
        });

        const { data: ref } = await github.rest.git.getRef({
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: `heads/${repo.default_branch}`
        });

        await github.rest.git.createRef({
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: `refs/heads/${branchName}`,
            sha: ref.object.sha
        });

        console.log(`✅ Created branch: ${branchName}`);

        let filePath;
        if (isPlace) {
            filePath = `public/data/places/${jsonData.id}.json`;
        } else if (isPortal) {
            filePath = `public/data/portals/${jsonData.id}_${jsonData.world}.json`;
        }

        const fileContent = JSON.stringify(jsonData, null, 2);
        const encodedContent = Buffer.from(fileContent).toString('base64');

        await github.rest.repos.createOrUpdateFileContents({
            owner: context.repo.owner,
            repo: context.repo.repo,
            path: filePath,
            message: `feat: add ${isPlace ? 'place' : 'portal'} ${jsonData.name}\n\nAutomatically generated from issue #${context.issue.number}`,
            content: encodedContent,
            branch: branchName
        });

        console.log(`✅ Created file: ${filePath}`);

        if (context.imageData) {
            console.log(`🖼️ Uploading image: ${context.imageData.path} (${context.imageData.size} bytes)`);
            const encodedImage = context.imageData.buffer.toString('base64');
            console.log(`🔄 Base64 encoded image size: ${encodedImage.length} characters`);

            try {
                await github.rest.repos.createOrUpdateFileContents({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    path: context.imageData.path,
                    message: `feat: add image for place ${jsonData.name}\n\nAutomatically uploaded from issue #${context.issue.number}`,
                    content: encodedImage,
                    branch: branchName
                });
                console.log(`✅ Successfully uploaded image: ${context.imageData.path}`);
            } catch (error) {
                console.error(`❌ Failed to upload image:`, error.message);
                throw error;
            }
        } else {
            console.log('ℹ️ No image data found, skipping image upload');
        }

        const prTitle = `${isPlace ? '🏠 Add new place' : '🌀 Add new portal'}: ${jsonData.name}`;
        let prBody = `## 🤖 Automatic PR generated from issue #${context.issue.number}\n\n`;
        prBody += `- **id:** \`${jsonData.id}\`\n`;
        prBody += `- **world:** \`${jsonData.world}\`\n`;
        prBody += `- **filename:** \`${filePath}\`\n`;

        if (context.imageData) {
            prBody += `- **image filename:** \`${context.imageData.path}\``;
        }

        const { data: pullRequest } = await github.rest.pulls.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: prTitle,
            head: branchName,
            base: repo.default_branch,
            body: prBody
        });

        const labels = context.payload.issue.labels.map(label => label.name);
        await github.rest.issues.addLabels({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: pullRequest.number,
            labels: ['community-contribution', isPlace ? 'place' : 'portal']
        });

        console.log(`✅ Created pull request: #${pullRequest.number}`);

        context.pullRequestUrl = pullRequest.html_url;
        context.pullRequestNumber = pullRequest.number;

    } catch (error) {
        console.log('❌ Failed to create PR:', error.message);
        await addErrorComment(github, context, `Erreur lors de la création automatique de la PR: ${error.message}`);
        throw error;
    }
}

/**
 * Adds a success comment to the issue and closes it.
 * @param {object} github - The GitHub object.
 * @param {object} context - The GitHub Actions context object.
 */
async function addSuccessComment(github, context) {
    const type = context.payload.issue.labels.some(label => label.name === 'place') ? 'lieu' : 'portail';
    const message = context.pullRequestUrl
        ? `✅ **Soumission acceptée !**\n\nVotre ${type} a été validé avec succès ! Une pull request a été créée automatiquement :\n➡️ **[Pull Request #${context.pullRequestNumber}](${context.pullRequestUrl})**\n\nMerci pour votre contribution ! 🎉\n\nCette issue va être fermée automatiquement car elle a été traitée.`
        : `✅ **Soumission acceptée !**\n\nVotre ${type} a été validé avec succès ! \n\nUn mainteneur va maintenant traiter votre demande. Vous serez notifié dès que c'est intégré à PMC Plan.\n\nMerci pour votre contribution ! 🎉\n\nCette issue va être fermée automatiquement car elle a été traitée.`;

    await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: message
    });

    await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        labels: ['check-passed']
    });

    await github.rest.issues.update({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        state: 'closed',
        state_reason: 'completed'
    });
}

/**
 * Adds an error comment to the issue and closes it.
 * @param {object} github - The GitHub object.
 * @param {object} context - The GitHub Actions context object.
 * @param {string} errorMessage - The error message.
 */
async function addErrorComment(github, context, errorMessage) {
    let userFriendlyMessage;

    if (errorMessage.includes('already exists')) {
        userFriendlyMessage = `L'ID que vous avez choisi existe déjà. Veuillez créer une nouvelle issue avec un identifiant unique.`;
    } else if (errorMessage.includes('Champs requis manquants') || errorMessage.includes('Required field missing')) {
        userFriendlyMessage = `Certains champs obligatoires sont manquants dans votre soumission. Veuillez créer une nouvelle issue en remplissant tous les champs requis.`;
    } else if (errorMessage.includes('Linked portal') && errorMessage.includes('not found')) {
        userFriendlyMessage = `Un des portails liés que vous avez mentionné n'existe pas. Veuillez vérifier les IDs des portails et créer une nouvelle issue.`;
    } else if (errorMessage.includes('validation failed') || errorMessage.includes('invalid')) {
        userFriendlyMessage = `Les données fournies ne respectent pas le format attendu. Veuillez créer une nouvelle issue en suivant attentivement le template.`;
    } else {
        userFriendlyMessage = `Il y a eu un problème avec votre soumission. Veuillez créer une nouvelle issue en vous assurant de bien remplir tous les champs.`;
    }

    const type = context.payload.issue.labels.some(label => label.name === 'place') ? 'lieu' : 'portail';
    await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `❌ **Soumission non valide**\n\n${userFriendlyMessage}\n\nPour soumettre votre ${type}, veuillez créer une **nouvelle issue** en utilisant le bon template.\n\nCette issue va être fermée automatiquement.`
    });

    await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        labels: ['check-failed']
    });

    await github.rest.issues.update({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        state: 'closed'
    });
}

/**
 * Handles the download and validation of an image.
 * @param {object} github - The GitHub object.
 * @param {object} context - The GitHub Actions context object.
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} placeId - The ID of the place associated with the image.
 */
async function handleImageDownload(github, context, imageUrl, placeId) {
    console.log(`Downloading image from: ${imageUrl}`);
    await downloadAndValidateImage(imageUrl, context.payload.issue.html_url, context, placeId);
}

/**
 * Downloads and validates an image from a given URL.
 * @param {string} imageUrl - The URL of the image to download.
 * @param {string} referer - The referer URL for the download request.
 * @param {object} context - The GitHub Actions context object.
 * @param {string} placeId - The ID of the place associated with the image.
 * @param {number} depth - The current recursion depth for redirects.
 */
async function downloadAndValidateImage(imageUrl, referer, context, placeId, depth = 0) {
    if (depth > 5) {
        throw new Error('Too many redirects trying to download the image.');
    }

    const fetch = require('node-fetch');
    const response = await fetch(imageUrl, {
        headers: { 'Referer': referer },
        redirect: 'manual'
    });

    if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
        const redirectUrl = response.headers.get('location');
        console.log(`🔄 Redirecting to: ${redirectUrl}`);
        return downloadAndValidateImage(redirectUrl, referer, context, placeId, depth + 1);
    }

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
        throw new Error(`Failed to download image. Status: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    const extension = contentType.split('/')[1];
    if (!['png', 'jpg', 'jpeg', 'gif'].includes(extension)) {
        throw new Error(`Unsupported image type: ${contentType}`);
    }

    const imageBuffer = await response.buffer();
    const imagePath = `public/data/place_images/${placeId}.${extension}`;
    const imageSize = imageBuffer.length;

    console.log(`✅ Image downloaded successfully. Path: ${imagePath}, Size: ${imageSize} bytes`);

    context.imageData = {
        buffer: imageBuffer,
        path: imagePath,
        size: imageSize
    };
}

/**
 * Extracts data from the issue body based on whether it's a place or portal.
 * @param {string} issueBody - The body of the GitHub issue.
 * @param {boolean} isPlace - True if the issue is for a place, false otherwise.
 * @param {boolean} isPortal - True if the issue is for a portal, false otherwise.
 * @returns {object} The extracted data.
 * @throws {Error} If required fields are missing or empty.
 */
function extractDataFromTemplate(issueBody, isPlace, isPortal) {
    const data = {};

    const extractField = () => {
        const lines = issueBody.split('\n');
        const fieldMatches = [];
        let inField = false;
        let currentValue = '';

        for (let i = 0; i < lines.length;
             i++) {
            const line = lines[i];
            if (line.startsWith('### ')) {
                if (inField) {
                    const cleanValue = currentValue.trim();
                    if (cleanValue === '' || cleanValue === '_No response_') {
                        fieldMatches.push('');
                    } else {
                        fieldMatches.push(cleanValue);
                    }
                }
                inField = true;
                currentValue = '';
            } else if (inField && line.trim() && !line.startsWith('-') && !line.startsWith('##')) {
                if (currentValue) currentValue += ' ';
                currentValue += line.trim();
            } else if (line.startsWith('### ') || line.startsWith('## ')) {
                if (inField) {
                    const cleanValue = currentValue.trim();
                    if (cleanValue === '' || cleanValue === '_No response_') {
                        fieldMatches.push('');
                    } else {
                        fieldMatches.push(cleanValue);
                    }
                    currentValue = '';
                }
                inField = line.startsWith('### ');
            }
        }

        if (inField) {
            const cleanValue = currentValue.trim();
            if (cleanValue === '' || cleanValue === '_No response_') {
                fieldMatches.push('');
            } else {
                fieldMatches.push(cleanValue);
            }
        }

        return fieldMatches;
    };

    const fieldValues = extractField();

    if (isPlace) {
        if (fieldValues.length >= 6) {
            data.placeId = fieldValues[0] || '';
            data.placeName = fieldValues[1] || '';
            data.world = fieldValues[2] || '';
            data.coordinatesX = fieldValues[3] || '';
            data.coordinatesY = fieldValues[4] || '';
            data.coordinatesZ = fieldValues[5] || '';
            data.description = fieldValues[6] || '';
            data.tags = fieldValues[7] || '';
            data.portals = fieldValues[8] || '';
            data.image = fieldValues[9] || '';
        }
    } else if (isPortal) {
        if (fieldValues.length >= 6) {
            data.portalId = fieldValues[0] || '';
            data.portalName = fieldValues[1] || '';
            data.world = fieldValues[2] || '';
            data.coordinatesX = fieldValues[3] || '';
            data.coordinatesY = fieldValues[4] || '';
            data.coordinatesZ = fieldValues[5] || '';
            data.description = fieldValues[6] || '';
        }
    }

    const requiredFields = isPlace
        ? ['placeId', 'placeName', 'world', 'coordinatesX', 'coordinatesY', 'coordinatesZ']
        : ['portalId', 'portalName', 'world', 'coordinatesX', 'coordinatesY', 'coordinatesZ'];

    const missingFields = [];
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        throw new Error(`Champs requis manquants ou vides: ${missingFields.join(', ')}`);
    }

    return data;
}

module.exports = { validateIssueData };