#!/usr/bin/env node

// Script to validate and generate files from PR template data
const fs = require('fs');
const { execSync } = require('child_process');

async function validatePRData(github, context) {
    const prBody = context.payload.pull_request.body;
    const isPlace = context.payload.pull_request.labels.some(label => label.name === 'place');
    const isPortal = context.payload.pull_request.labels.some(label => label.name === 'portal');
    
    if (!isPlace && !isPortal) {
        console.log('❌ PR must be labeled as either place or portal');
        await addPRComment(github, context, '❌ **Label requis !** Cette PR doit avoir le label `place` ou `portal` pour déclencher la validation automatique.');
        return;
    }
    
    // Extract data from PR template
    let extractedData;
    try {
        extractedData = extractDataFromPRTemplate(prBody, isPlace, isPortal);
        console.log('Extracted data:', extractedData);
    } catch (error) {
        console.log('❌ Failed to extract data from PR template:', error.message);
        await addPRComment(github, context, `❌ **Erreur d'extraction des données**\n\n${error.message}\n\nVeuillez vérifier que vous avez bien rempli tous les champs requis dans le template de la PR.`);
        return;
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
        
        // Try to generate the file and commit it to the PR branch
        const fileGenerated = await generateFileInPR(github, context, jsonData, isPlace, isPortal);
        
        // Add success comment
        if (fileGenerated !== false) {
            await addPRComment(github, context, '✅ **Validation réussie !** Le fichier JSON a été généré automatiquement et ajouté à cette PR. Un mainteneur peut maintenant la merger.');
        } else {
            const filePath = isPlace ? `public/data/places/${jsonData.id}.json` : `public/data/portals/${jsonData.id}_${jsonData.world}.json`;
            await addPRComment(github, context, `✅ **Validation réussie !** 
            
Veuillez créer le fichier suivant dans votre branche :
**Fichier :** \`${filePath}\`

**Contenu :**
\`\`\`json
${JSON.stringify(jsonData, null, 2)}
\`\`\`

Un mainteneur pourra ensuite merger cette PR.`);
        }
        
    } catch (error) {
        console.log('❌ Validation failed:', error.message);
        await addPRComment(github, context, `❌ **Validation échouée !**\n\n\`\`\`\n${error.message}\n\`\`\`\n\nVeuillez corriger les problèmes et mettre à jour votre PR.`);
        
    } finally {
        // Cleanup
        if (fs.existsSync('temp-data.json')) {
            fs.unlinkSync('temp-data.json');
        }
    }
}

async function generateFileInPR(github, context, jsonData, isPlace, isPortal) {
    const prNumber = context.payload.pull_request.number;
    const headOwner = context.payload.pull_request.head.repo.owner.login;
    const headRepo = context.payload.pull_request.head.repo.name;
    const headRef = context.payload.pull_request.head.ref;
    
    // Determine file path
    let filePath;
    if (isPlace) {
        filePath = `public/data/places/${jsonData.id}.json`;
    } else if (isPortal) {
        filePath = `public/data/portals/${jsonData.id}_${jsonData.world}.json`;
    }
    
    try {
        // Check if file already exists in the PR branch
        let existingFile = null;
        try {
            const { data } = await github.rest.repos.getContent({
                owner: headOwner,
                repo: headRepo,
                path: filePath,
                ref: headRef
            });
            existingFile = data;
        } catch (error) {
            // File doesn't exist, that's fine
        }
        
        // Create file content
        const fileContent = JSON.stringify(jsonData, null, 2);
        const encodedContent = Buffer.from(fileContent).toString('base64');
        
        // Create or update the file in the PR branch (in the fork)
        await github.rest.repos.createOrUpdateFileContents({
            owner: headOwner,
            repo: headRepo,
            path: filePath,
            message: `feat: add ${isPlace ? 'place' : 'portal'} ${jsonData.name}\n\nAutomatically generated from PR #${prNumber}`,
            content: encodedContent,
            branch: headRef,
            sha: existingFile ? existingFile.sha : undefined
        });
        
        console.log(`✅ Created/updated file: ${filePath} in PR branch`);
        
    } catch (error) {
        console.log('❌ Failed to create file in PR:', error.message);
        // If we can't write to the fork, that's ok - we'll just validate without generating
        console.log('Note: Unable to write to fork repository. The file will need to be created manually.');
        return false;
    }
}

async function addPRComment(github, context, message) {
    await github.rest.issues.createComment({
        issue_number: context.payload.pull_request.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: message
    });
}

function extractDataFromPRTemplate(prBody, isPlace, isPortal) {
    const data = {};
    
    // Extract form data using regex patterns for markdown format
    const extractField = (fieldName) => {
        const regex = new RegExp(`\\*\\*${fieldName}\\s*:\\*\\*\\s*(.+)`, 'i');
        const match = prBody.match(regex);
        return match ? match[1].trim().replace(/`/g, '') : '';
    };

    if (isPlace) {
        data.placeId = extractField('ID');
        data.placeName = extractField('Nom');
        data.world = extractField('Monde');
        data.coordinatesX = extractField('X');
        data.coordinatesY = extractField('Y');
        data.coordinatesZ = extractField('Z');
        data.description = extractField('Description') || '';
        data.tags = extractField('Tags') || '';
        data.portals = extractField('Portails') || '';
    } else if (isPortal) {
        data.portalId = extractField('ID');
        data.portalName = extractField('Nom');
        data.world = extractField('Monde');
        data.coordinatesX = extractField('X');
        data.coordinatesY = extractField('Y');
        data.coordinatesZ = extractField('Z');
        data.description = extractField('Description') || '';
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
        throw new Error(`Champs requis manquants: ${missingFields.join(', ')}`);
    }
    
    return data;
}

module.exports = { validatePRData };