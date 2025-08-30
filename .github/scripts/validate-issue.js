#!/usr/bin/env node

// Script to validate JSON from GitHub issue template
const fs = require('fs');
const { execSync } = require('child_process');

async function validateIssueData(github, context) {
    const issueBody = context.payload.issue.body;
    const isPlace = context.payload.issue.labels.some(label => label.name === 'place');
    const isPortal = context.payload.issue.labels.some(label => label.name === 'portal');
    
    // Extract JSON from the issue body
    const jsonMatch = issueBody.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    
    if (!jsonMatch) {
        console.log('❌ No JSON found in issue body');
        await addErrorComment(github, context, 'No JSON code block found in issue body. Please provide your data in a ```json code block.');
        process.exit(1);
    }
    
    const jsonData = jsonMatch[1];
    console.log('Extracted JSON:', jsonData);
    
    // Write JSON to temp file
    fs.writeFileSync('temp-data.json', jsonData);
    
    try {
        // Validate JSON syntax
        JSON.parse(jsonData);
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
            const parsedData = JSON.parse(jsonData);
            if (parsedData.portals && parsedData.portals.length > 0) {
                console.log('Validating linked portals exist...');
                
                for (const portalId of parsedData.portals) {
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

module.exports = { validateIssueData };