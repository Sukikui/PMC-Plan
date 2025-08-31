const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Main function to validate the issue and trigger the PR creation.
 */
async function validateIssueData(github, context) {
    const issueBody = context.payload.issue.body;
    const issueLabels = context.payload.issue.labels.map(label => label.name);
    const isPlace = issueLabels.includes('place');
    const isPortal = issueLabels.includes('portal');

    if (!isPlace && !isPortal) {
        console.log('Issue must be labeled as either \'place\' or \'portal\'. Skipping.');
        return;
    }

    let extractedData;
    try {
        extractedData = extractDataFromTemplate(issueBody, { isPlace, isPortal });
        console.log('Extracted data:', extractedData);
    } catch (error) {
        console.log(`❌ Failed to extract data from template: ${error.message}`);
        await addErrorComment(github, context, error.message);
        return;
    }

    const { generatePlaceJson, generatePortalJson } = require('./generate-json.js');
    const jsonData = isPlace ? generatePlaceJson(extractedData) : generatePortalJson(extractedData);
    console.log('Generated JSON:', JSON.stringify(jsonData, null, 2));

    const tempJsonPath = 'temp-data.json';
    fs.writeFileSync(tempJsonPath, JSON.stringify(jsonData, null, 2));

    try {
        validateJsonData(jsonData, { isPlace });

        if (isPlace && extractedData.image) {
            await processImage(github, context, jsonData.id);
        }

        await generateFilesAndCreatePR(github, context, jsonData, { isPlace, isPortal });
        await addSuccessComment(github, context);

    } catch (error) {
        console.log(`❌ Validation failed: ${error.message}`);
        await addErrorComment(github, context, error.message);
    } finally {
        if (fs.existsSync(tempJsonPath)) {
            fs.unlinkSync(tempJsonPath);
        }
    }
}

/**
 * Validates the extracted JSON data against the schema and business rules.
 */
function validateJsonData(jsonData, { isPlace }) {
    const schemaFile = isPlace ? '.github/schemas/place-schema.json' : '.github/schemas/portal-schema.json';
    console.log(`Validating against schema: ${schemaFile}`);
    execSync(`ajv validate -s ${schemaFile} -d temp-data.json --verbose`, { stdio: 'inherit' });
    console.log('✅ Schema validation passed');

    const id = jsonData.id;
    const world = jsonData.world;
    const filePath = isPlace ? `public/data/places/${id}.json` : `public/data/portals/${id}_${world}.json`;

    if (fs.existsSync(filePath)) {
        throw new Error(`ID '${id}' already exists at ${filePath}. Please choose a unique identifier.`);
    }
    console.log('✅ ID uniqueness verified');

    if (isPlace && jsonData.portals && jsonData.portals.length > 0) {
        console.log('Validating linked portals exist...');
        for (const portalId of jsonData.portals) {
            const overworldFile = `public/data/portals/${portalId}_overworld.json`;
            const netherFile = `public/data/portals/${portalId}_nether.json`;
            if (!fs.existsSync(overworldFile) && !fs.existsSync(netherFile)) {
                throw new Error(`Linked portal '${portalId}' not found. Expected ${overworldFile} or ${netherFile} to exist.`);
            }
        }
        console.log('✅ All linked portals exist');
    }
}

/**
 * Fetches the issue as HTML and triggers the image download.
 */
async function processImage(github, context, placeId) {
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
        // For debugging, let's log the first 500 chars of the HTML body
        console.log(issueBodyHtml.substring(0, 500));

        const imageUrlMatch = issueBodyHtml.match(/<img[^>]+src="([^"]+)"/);

        if (imageUrlMatch && imageUrlMatch[1]) {
            const imageUrl = imageUrlMatch[1];
            console.log(`✅ Found image URL in HTML body: ${imageUrl}`);
            await handleImageDownload(context, imageUrl, placeId);
            console.log('✅ Image download and validation completed');
        } else {
            console.log('⚠️ Could not find image URL in HTML body. Regex did not match.');
        }
    } catch (error) {
        console.log(`⚠️ Image processing failed: ${error.message}`);
    }
}

/**
 * Orchestrates the PR creation process.
 */
async function generateFilesAndCreatePR(github, context, jsonData, { isPlace, isPortal }) {
    const branchName = `add-${isPlace ? 'place' : 'portal'}/${jsonData.id}`;
    console.log(`🚀 Starting automatic PR creation on branch ${branchName}...`);

    const defaultBranch = context.payload.repository.default_branch;
    const { data: ref } = await github.rest.git.getRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `heads/${defaultBranch}`
    });

    await github.rest.git.createRef({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha
    });
    console.log(`✅ Created branch: ${branchName}`);

    const jsonFilePath = isPlace
        ? `public/data/places/${jsonData.id}.json`
        : `public/data/portals/${jsonData.id}_${jsonData.world}.json`;

    await commitFile(github, context, jsonFilePath, JSON.stringify(jsonData, null, 2), `feat: add ${isPlace ? 'place' : 'portal'} ${jsonData.name}`, branchName);

    if (context.imageData) {
        await commitFile(github, context, context.imageData.path, context.imageData.buffer, `feat: add image for place ${jsonData.name}`, branchName);
    }

    const prTitle = `${isPlace ? '🏠 Add new place' : '🌀 Add new portal'}: ${jsonData.name}`;

    const headers = ['ID', 'World', 'Filename'];
    const row = [`${jsonData.id}`, `${jsonData.world}`, `${jsonFilePath}`];

    if (context.imageData) {
        headers.push('Image Filename');
        row.push(`${context.imageData.path}`);
    }

    let prBody = `## 🤖 Automatic PR generated from issue #${context.issue.number}\n\n`;
    prBody += `| ${headers.join(' | ')} |\n`;
    prBody += `| ${headers.map(() => '---').join(' | ')} |\n`;
    prBody += `| ${row.join(' | ')} |`;

    const { data: pullRequest } = await github.rest.pulls.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: prTitle,
        head: branchName,
        base: defaultBranch,
        body: prBody
    });

    const labels = context.payload.issue.labels.map(label => label.name);
    await github.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pullRequest.number,
        labels: labels
    });

    console.log(`✅ Created pull request: #${pullRequest.number}`);
    context.pullRequestUrl = pullRequest.html_url;
    context.pullRequestNumber = pullRequest.number;
}

/**
 * Commits a file to the repository.
 */
async function commitFile(github, context, path, content, message, branch) {
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    await github.rest.repos.createOrUpdateFileContents({
        owner: context.repo.owner,
        repo: context.repo.repo,
        path,
        message: `${message}\n\nAutomatically generated from issue #${context.issue.number}`,
        content: buffer.toString('base64'),
        branch
    });
    console.log(`✅ Committed file: ${path}`);
}

/**
 * Posts a success comment and closes the issue.
 */
async function addSuccessComment(github, context) {
    const type = context.payload.issue.labels.some(l => l.name === 'place') ? 'lieu' : 'portail';
    const message = `✅ **Soumission acceptée !**

Votre ${type} a été validé avec succès ! Une pull request a été créée automatiquement :
➡️ **[Pull Request #${context.pullRequestNumber}](${context.pullRequestUrl})**

Merci pour votre contribution ! 🎉

Cette issue va être fermée automatiquement car elle a été traitée.`;

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
 * Posts an error comment and closes the issue.
 */
async function addErrorComment(github, context, errorMessage) {
    // Parse common error types to provide user-friendly messages
    let userFriendlyMessage;

    if (errorMessage.includes('already exists')) {
        userFriendlyMessage = `L\'ID que vous avez choisi existe déjà. Veuillez créer une nouvelle issue avec un identifiant unique.`;
    } else if (errorMessage.includes('Champs requis manquants') || errorMessage.includes('Required field missing')) {
        userFriendlyMessage = `Certains champs obligatoires sont manquants dans votre soumission. Veuillez créer une nouvelle issue en remplissant tous les champs requis.`;
    } else if (errorMessage.includes('Linked portal') && errorMessage.includes('not found')) {
        userFriendlyMessage = `Un des portails liés que vous avez mentionné n\'existe pas. Veuillez vérifier les IDs des portails et créer une nouvelle issue.`;
    } else if (errorMessage.includes('validation failed') || errorMessage.includes('invalid')) {
        userFriendlyMessage = `Les données fournies ne respectent pas le format attendu. Veuillez créer une nouvelle issue en suivant attentivement le template.`;
    } else {
        userFriendlyMessage = `Il y a eu un problème avec votre soumission. Veuillez créer une nouvelle issue en vous assurant de bien remplir tous les champs.`;
    }

    const type = context.payload.issue.labels.some(l => l.name === 'place') ? 'lieu' : 'portail';

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
 * Downloads the image from the given URL.
 */
async function handleImageDownload(context, imageUrl, placeId) {
    console.log(`Downloading image from: ${imageUrl}`);
    await downloadAndValidateImage(imageUrl, context.payload.issue.html_url, context, placeId);
}

async function downloadAndValidateImage(imageUrl, referer, context, placeId, depth = 0) {
    if (depth > 5) throw new Error('Too many redirects trying to download the image.');

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

    context.imageData = {
        buffer: await response.buffer(),
        path: `public/data/place_images/${placeId}.${extension}`,
        size: response.headers.get('content-length') || -1
    };
}

/**
 * Extracts structured data from the issue body.
 */
function extractDataFromTemplate(issueBody, { isPlace, isPortal }) {
    const data = {};

    const extractField = (fieldName) => {
        const regex = new RegExp(`###\\s*${fieldName}\\s*\\n+([\\s\\S]*?)(?=\\n###|$)`);
        const match = issueBody.match(regex);
        if (match && match[1]) {
            const value = match[1].trim();
            if (value !== '_No response_') {
                return value;
            }
        }
        return '';
    };

    if (isPlace) {
        data.placeId = extractField('ID du lieu');
        data.placeName = extractField('Nom du lieu');
        data.world = extractField('Monde');
        data.coordinatesX = extractField('Coordonnée X');
        data.coordinatesY = extractField('Coordonnée Y');
        data.coordinatesZ = extractField('Coordonnée Z');
        data.description = extractField('Description (optionnel)');
        data.tags = extractField('Étiquettes');
        data.portals = extractField('Portails liés');
        data.image = extractField('Image du lieu (optionnel)');
    } else if (isPortal) {
        data.portalId = extractField('ID du portail');
        data.portalName = extractField('Nom du portail');
        data.world = extractField('Monde');
        data.coordinatesX = extractField('Coordonnée X');
        data.coordinatesY = extractField('Coordonnée Y');
        data.coordinatesZ = extractField('Coordonnée Z');
        data.description = extractField('Description (optionnel)');
    }

    const requiredFields = isPlace
        ? ['placeId', 'placeName', 'world', 'coordinatesX', 'coordinatesY', 'coordinatesZ']
        : ['portalId', 'portalName', 'world', 'coordinatesX', 'coordinatesY', 'coordinatesZ'];

    for (const field of requiredFields) {
        if (!data[field]) {
            throw new Error(`Champs requis manquants ou vides: ${field}`);
        }
    }

    return data;
}

module.exports = { validateIssueData };