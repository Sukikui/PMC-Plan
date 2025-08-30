#!/bin/bash

# Script to validate portals JSON files
set -e

echo "🌀 Validating Portals..."

# Validate JSON schema for portals
validate_portals_schema() {
    local files="$1"
    echo "Validating portals against schema..."
    
    for file in $files; do
        if [[ $file == public/data/portals/*.json ]]; then
            echo "Validating portal: $file"
            ajv validate -s .github/schemas/portal-schema.json -d "$file" --verbose
            if [ $? -ne 0 ]; then
                echo "❌ Schema validation failed for $file"
                exit 1
            else
                echo "✅ Schema validation passed for $file"
            fi
        fi
    done
}

# Check for duplicate portal IDs
check_duplicate_portal_ids() {
    echo "Checking for duplicate portal IDs..."
    
    if ls public/data/portals/*.json 1> /dev/null 2>&1; then
        DUPLICATE_PORTAL_IDS=$(jq -r '.id' public/data/portals/*.json | sort | uniq -d)
        if [ ! -z "$DUPLICATE_PORTAL_IDS" ]; then
            echo "❌ Duplicate portal IDs found: $DUPLICATE_PORTAL_IDS"
            exit 1
        fi
        echo "✅ No duplicate portal IDs found"
    fi
}

# Validate filename matches ID and world for portals
validate_portal_filenames() {
    local files="$1"
    echo "Validating portal filenames match ID and world..."
    
    for file in $files; do
        if [[ $file == public/data/portals/*.json ]]; then
            filename=$(basename "$file" .json)
            json_id=$(jq -r '.id' "$file")
            json_world=$(jq -r '.world' "$file")
            expected_filename="${json_id}_${json_world}"
            if [ "$filename" != "$expected_filename" ]; then
                echo "❌ Filename '$filename' doesn't match expected '${expected_filename}' (ID: '$json_id', World: '$json_world') in $file"
                exit 1
            else
                echo "✅ Filename matches ID and world for $file"
            fi
        fi
    done
}

# Main validation function
validate_portals() {
    local changed_files="$1"
    
    if [ -z "$changed_files" ]; then
        echo "No portal files to validate"
        return 0
    fi
    
    validate_portals_schema "$changed_files"
    check_duplicate_portal_ids
    validate_portal_filenames "$changed_files"
    
    echo "🎉 All portal validations passed!"
}

# Run validation if script is called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    if [ $# -eq 0 ]; then
        echo "Usage: $0 'file1.json file2.json ...'"
        exit 1
    fi
    validate_portals "$1"
fi