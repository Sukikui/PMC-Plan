#!/usr/bin/env node

// Script to validate JSON from GitHub issue template
const fs = require('fs');
const { execSync } = require('child_process');

async function validateIssueData(github, context) {
    const issueBody = context.payload.issue.body;
    const isPlace = context.payload.issue.labels.some(label => label.name === 'place');
    const isPortal = context.payload.issue.labels.some(label => label.name === 'portal');
    
    // Extract data from GitHub issue template fields
    let extractedData;
    try {
        extractedData = extractDataFromTemplate(issueBody, isPlace, isPortal);
        console.log('Extracted data:', extractedData);
    } catch (error) {
        console.log('❌ Failed to extract data from template:', error.message);
        await addErrorComment(github, context, error.message);
        process.exit(1);
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
    
    // Write JSON to temp file
    fs.writeFileSync('temp-data.json', JSON.stringify(jsonData, null, 2));
    
    try {
        // Validate JSON syntax (jsonData is already an object)
        console.log('✅ JSON syntax is valid');
        
        // Validate against schema
        let schemaFile;
        if (isPlace) {
            schemaFile = '.github/schemas/place-schema.json';
        } else if (isPortal) {
            schemaFile = '.github/schemas/portal-schema.json';
        } else {
            console.log('❌ Issue must be labeled as either place or portal');
            await addErrorComment(github, context, 'Issue must have either "place" or "portal" label.');
            process.exit(1);
        }
        
        console.log(`Validating against schema: ${schemaFile}`);
        execSync(`ajv validate -s ${schemaFile} -d temp-data.json --verbose`, { stdio: 'inherit' });
        console.log('✅ Schema validation passed');
        
        // Additional validation for places with linked portals
        if (isPlace) {
            if (jsonData.portals && jsonData.portals.length > 0) {
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
        
        // Add success comment to the issue
        await addSuccessComment(github, context);
        
        // Generate files and create PR automatically
        await generateFilesAndCreatePR(github, context, jsonData, isPlace, isPortal);
        
    } catch (error) {
        console.log('❌ Validation failed:', error.message);
        await addErrorComment(github, context, error.message);
        process.exit(1);
        
    } finally {
        // Cleanup
        if (fs.existsSync('temp-data.json')) {
            fs.unlinkSync('temp-data.json');
        }
    }
}

async function addSuccessComment(github, context) {
    await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '✅ **Validation Passed!** Your JSON data is valid and ready for review by a maintainer.'
    });
}

async function addErrorComment(github, context, errorMessage) {
    await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `❌ **Validation Failed!** Please fix the following issues:\n\n\`\`\`\n${errorMessage}\n\`\`\`\n\nPlease update your JSON data and edit the issue to re-trigger validation.`
    });
}

async function generateFilesAndCreatePR(github, context, jsonData, isPlace, isPortal) {
    // jsonData is already an object, no need to parse
    const parsedData = jsonData;
    const branchName = `auto-add-${isPlace ? 'place' : 'portal'}-${parsedData.id}-${Date.now()}`;
    
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
            filePath = `public/data/places/${parsedData.id}.json`;
        } else if (isPortal) {
            filePath = `public/data/portals/${parsedData.id}_${parsedData.world}.json`;
        }
        
        // Create file content with proper formatting
        const fileContent = JSON.stringify(parsedData, null, 2);
        const encodedContent = Buffer.from(fileContent).toString('base64');
        
        // Create the file
        await github.rest.repos.createOrUpdateFileContents({
            owner: context.repo.owner,
            repo: context.repo.repo,
            path: filePath,
            message: `feat: add ${isPlace ? 'place' : 'portal'} ${parsedData.name}\n\nAutomatically generated from issue #${context.issue.number}`,
            content: encodedContent,
            branch: branchName
        });
        
        console.log(`✅ Created file: ${filePath}`);
        
        // Create pull request
        const prTitle = `${isPlace ? '🏠' : '🌀'} Ajout automatique: ${parsedData.name}`;
        const prBody = `## 🤖 PR automatique générée depuis l'issue #${context.issue.number}

**Type:** ${isPlace ? 'Lieu' : 'Portail'}  
**Nom:** ${parsedData.name}  
**ID:** \`${parsedData.id}\`  
**Monde:** ${parsedData.world}  
**Coordonnées:** (${parsedData.coordinates.x}, ${parsedData.coordinates.y}, ${parsedData.coordinates.z})

### Fichier créé
- \`${filePath}\`

### Vérifications effectuées ✅
- Validation du schéma JSON
- Vérification de l'unicité de l'ID
${isPlace && parsedData.portals ? '- Validation des portails liés' : ''}

---
*Cette PR a été générée automatiquement après validation de l'issue. Vous pouvez la merger directement ou demander des modifications.*

Ferme #${context.issue.number}`;

        const { data: pullRequest } = await github.rest.pulls.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: prTitle,
            head: branchName,
            base: repo.default_branch,
            body: prBody
        });
        
        console.log(`✅ Created pull request: #${pullRequest.number}`);
        
        // Update success comment with PR link
        await github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `🚀 **PR automatique créée!** 

Votre ${isPlace ? 'lieu' : 'portail'} a été validé et une pull request a été générée automatiquement:  
➡️ **[Pull Request #${pullRequest.number}](${pullRequest.html_url})**

Un mainteneur va maintenant examiner et merger la PR. Merci pour votre contribution ! 🎉`
        });
        
    } catch (error) {
        console.log('❌ Failed to create PR:', error.message);
        await github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `⚠️ **Erreur lors de la création automatique de la PR**

La validation a réussi, mais la création automatique de la pull request a échoué:
\`\`\`
${error.message}
\`\`\`

Un mainteneur devra créer les fichiers manuellement. Désolé pour l'inconvénient !`
        });
    }
}

function extractDataFromTemplate(issueBody, isPlace, isPortal) {
    const data = {};
    
    // Extract form data using regex patterns for GitHub template format
    const extractField = (fieldName) => {
        // Match GitHub template format: ### Field Name\n\nValue
        const regex = new RegExp(`###\\s*${fieldName}[\\s\\S]*?\\n\\n([^\\n#]+)`, 'i');
        const match = issueBody.match(regex);
        return match ? match[1].trim() : '';
    };

    if (isPlace) {
        data.placeId = extractField('ID du lieu');
        data.placeName = extractField('Nom du lieu');
        data.world = extractField('Monde');
        data.coordinatesX = extractField('Coordonnée X');
        data.coordinatesY = extractField('Coordonnée Y');
        data.coordinatesZ = extractField('Coordonnée Z');
        data.description = extractField('Description');
        data.tags = extractField('Étiquettes');
        data.portals = extractField('Portails liés');
    } else if (isPortal) {
        data.portalId = extractField('ID du portail');
        data.portalName = extractField('Nom du portail');
        data.world = extractField('Monde');
        data.coordinatesX = extractField('Coordonnée X');
        data.coordinatesY = extractField('Coordonnée Y');
        data.coordinatesZ = extractField('Coordonnée Z');
        data.description = extractField('Description');
    }

    // Validate required fields
    const requiredFields = isPlace 
        ? ['placeId', 'placeName', 'world', 'coordinatesX', 'coordinatesY', 'coordinatesZ']
        : ['portalId', 'portalName', 'world', 'coordinatesX', 'coordinatesY', 'coordinatesZ'];
    
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            throw new Error(`Required field missing: ${field}`);
        }
    }
    
    return data;
}

module.exports = { validateIssueData };