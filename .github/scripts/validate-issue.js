const fs = require('fs');
const { execSync } = require('child_process');

async function validateIssueData(github, context) {
    const issueBody = context.payload.issue.body;
    const isPlace = context.payload.issue.labels.some(label => label.name === 'place');
    const isPortal = context.payload.issue.labels.some(label => label.name === 'portal');

    if (!isPlace && !isPortal) {
        console.log('❌ Issue must be labeled as either place or portal');
        return;
    }

    // Extract data from GitHub issue template fields
    let extractedData;
    try {
        extractedData = extractDataFromTemplate(issueBody, isPlace, isPortal);
        console.log('Extracted data:', extractedData);
    } catch (error) {
        console.log('❌ Failed to extract data from template:', error.message);
        await addErrorComment(github, context, error.message);
        return;
    }

    // Extract image URL if present
    if (isPlace && extractedData.image && extractedData.image.trim()) {
        const imageUrlMatch = extractedData.image.match(/<img[^>]+src="([^">]+)"/);
        if (imageUrlMatch && imageUrlMatch[1]) {
            extractedData.imageUrl = imageUrlMatch[1];
            console.log(`🖼️ Found image URL: ${extractedData.imageUrl}`);
        }
    }

    // Generate JSON from extracted data
    const { generatePlaceJson, generatePortalJson } = require('./generate-json.js');
    let jsonData;

    if (isPlace) {
        jsonData = generatePlaceJson(extractedData);
    } else if (isPortal) {
        jsonData = generatePortalJson(extractedData);
    }

    console.log('Generated JSON:', JSON.stringify(jsonData, null, 2));

    // Write JSON to temp file for validation
    fs.writeFileSync('temp-data.json', JSON.stringify(jsonData, null, 2));

    try {
        // Validate against schema
        let schemaFile;
        if (isPlace) {
            schemaFile = '.github/schemas/place-schema.json';
        } else if (isPortal) {
            schemaFile = '.github/schemas/portal-schema.json';
        }

        console.log(`Validating against schema: ${schemaFile}`);
        execSync(`ajv validate -s ${schemaFile} -d temp-data.json --verbose`, { stdio: 'inherit' });
        console.log('✅ Schema validation passed');

        // Check ID uniqueness
        const filePath = isPlace
            ? `public/data/places/${jsonData.id}.json`
            : `public/data/portals/${jsonData.id}_${jsonData.world}.json`;

        if (fs.existsSync(filePath)) {
            throw new Error(`ID '${jsonData.id}' already exists at ${filePath}. Please choose a unique identifier.`);
        }
        console.log('✅ ID uniqueness verified');

        // Additional validation for places with linked portals
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

        // Generate files and create PR automatically
        await generateFilesAndCreatePR(github, context, jsonData, isPlace, isPortal);

        // Add success comment to the issue
        await addSuccessComment(github, context);

    } catch (error) {
        console.log('❌ Validation failed:', error.message);
        await addErrorComment(github, context, error.message);

    } finally {
        // Cleanup
        if (fs.existsSync('temp-data.json')) {
            fs.unlinkSync('temp-data.json');
        }
    }
}

async function generateFilesAndCreatePR(github, context, jsonData, isPlace, isPortal) {
    const branchName = `add-${isPlace ? 'place' : 'portal'}/${jsonData.id}`;

    try {
        console.log('🚀 Starting automatic PR creation...');

        // Get default branch reference
        const { data: repo } = await github.rest.repos.get({
            owner: context.repo.owner,
            repo: context.repo.repo
        });

        const { data: ref } = await github.rest.git.getRef({
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: `heads/${repo.default_branch}`
        });

        // Create new branch
        await github.rest.git.createRef({
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: `refs/heads/${branchName}`,
            sha: ref.object.sha
        });

        console.log(`✅ Created branch: ${branchName}`);

        // Determine file path and content
        let filePath;
        if (isPlace) {
            filePath = `public/data/places/${jsonData.id}.json`;
        } else if (isPortal) {
            filePath = `public/data/portals/${jsonData.id}_${jsonData.world}.json`;
        }

        // Create file content with proper formatting
        const fileContent = JSON.stringify(jsonData, null, 2);
        const encodedContent = Buffer.from(fileContent).toString('base64');

        // Create the file
        await github.rest.repos.createOrUpdateFileContents({
            owner: context.repo.owner,
            repo: context.repo.repo,
            path: filePath,
            message: `feat: add ${isPlace ? 'place' : 'portal'} ${jsonData.name}\n\nAutomatically generated from issue #${context.issue.number}`,
            content: encodedContent,
            branch: branchName
        });

        console.log(`✅ Created file: ${filePath}`);

        // Create pull request
        const prTitle = `${isPlace ? '🏠 Add new place' : '🌀 Add new portal'}: ${jsonData.name}`;
        const prBody = `## 🤖 Automatic PR generated from issue #${context.issue.number}\n\n**ID:** 
${jsonData.id}
  
**World:** 
${jsonData.world}
 
**Created file:** 
${filePath}${jsonData.imageUrl ? `\n**Image URL:** ${jsonData.imageUrl}` : ''}`;

        const { data: pullRequest } = await github.rest.pulls.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: prTitle,
            head: branchName,
            base: repo.default_branch,
            body: prBody
        });

        // Add the same labels as the issue
        await github.rest.issues.addLabels({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: pullRequest.number,
            labels: ['community-contribution', isPlace ? 'place' : 'portal']
        });

        console.log(`✅ Created pull request: #${pullRequest.number}`);

        // Store PR info for the success comment
        context.pullRequestUrl = pullRequest.html_url;
        context.pullRequestNumber = pullRequest.number;

    } catch (error) {
        console.log('❌ Failed to create PR:', error.message);
        await addErrorComment(github, context, `Erreur lors de la création automatique de la PR: ${error.message}`);
        throw error;
    }
}

async function addSuccessComment(github, context) {
    const type = context.payload.issue.labels.some(l => l.name === 'place') ? 'lieu' : 'portail';
    const message = context.pullRequestUrl
        ? `✅ **Soumission acceptée !**\n\nVotre ${type} a été validé avec succès ! Une pull request a été créée automatiquement :\n➡️ **[Pull Request #${context.pullRequestNumber}](${context.pullRequestUrl})**\n\nMerci pour votre contribution ! 🎉\n\nCette issue va être fermée automatiquement car elle a été traitée.`
        : `✅ **Soumission acceptée !**\n\nVotre ${type} a été validé avec succès ! \n\nUn mainteneur va maintenant traiter votre demande. Vous serez notifié dès que c'est intégré à PMC Plan.\n\nMerci pour votre contribution ! 🎉\n\nCette issue va être fermée automatiquement car elle a été traitée.`;

    await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: message
    });

    // Add success check label and close the issue
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

async function addErrorComment(github, context, errorMessage) {
    // Parse common error types to provide user-friendly messages
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

    await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `❌ **Soumission non valide**\n\n${userFriendlyMessage}\n\nPour soumettre votre ${context.payload.issue.labels.some(l => l.name === 'place') ? 'lieu' : 'portail'}, veuillez créer une **nouvelle issue** en utilisant le bon template.\n\nCette issue va être fermée automatiquement.`
    });

    // Add failed check label and close the issue
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

function extractDataFromTemplate(issueBody, isPlace, isPortal) {
    const data = {};

    // GitHub issue template fields are embedded in the body with specific format
    // Format: ### Field Label\n\nValue\n\n
    const extractField = (fieldId) => {
        // Try different patterns for GitHub issue template format
        const patterns = [
            // Pattern for inputs: ### Label\n\nValue
            new RegExp(`### [^\n]*\n\n([^#\n][^\n#]*?)(?:\n\n|$)`, 'g'),
            // Pattern for dropdowns: ### Label\n\nValue
            new RegExp(`### [^\n]*\n\n([^#\n][^\n]*?)(?:\n|$)`, 'g')
        ];

        // Extract all field values and match to expected order
        const lines = issueBody.split('\n');
        const fieldMatches = [];
        let inField = false;
        let currentValue = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('### ')) {
                if (inField) {
                    // Handle empty fields (GitHub puts "_No response_")
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
        // Expected order: ID, Name, World, X, Y, Z, Description, Tags, Portals, Image
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
        // Expected order: ID, Name, World, X, Y, Z, Description
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

    // Validate required fields
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