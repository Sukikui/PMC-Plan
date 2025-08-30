#!/bin/bash

# Script to validate places JSON files
set -e

echo "🏠 Validating Places..."

# Validate JSON schema for places
validate_places_schema() {
    local files="$1"
    echo "Validating places against schema..."
    
    for file in $files; do
        if [[ $file == public/data/places/*.json ]]; then
            echo "Validating place: $file"
            ajv validate -s .github/schemas/place-schema.json -d "$file" --verbose
            if [ $? -ne 0 ]; then
                echo "❌ Schema validation failed for $file"
                exit 1
            else
                echo "✅ Schema validation passed for $file"
            fi
        fi
    done
}

# Check for duplicate place IDs
check_duplicate_place_ids() {
    echo "Checking for duplicate place IDs..."
    
    if ls public/data/places/*.json 1> /dev/null 2>&1; then
        DUPLICATE_PLACE_IDS=$(jq -r '.id' public/data/places/*.json | sort | uniq -d)
        if [ ! -z "$DUPLICATE_PLACE_IDS" ]; then
            echo "❌ Duplicate place IDs found: $DUPLICATE_PLACE_IDS"
            exit 1
        fi
        echo "✅ No duplicate place IDs found"
    fi
}

# Validate filename matches ID for places
validate_place_filenames() {
    local files="$1"
    echo "Validating place filenames match IDs..."
    
    for file in $files; do
        if [[ $file == public/data/places/*.json ]]; then
            filename=$(basename "$file" .json)
            json_id=$(jq -r '.id' "$file")
            if [ "$filename" != "$json_id" ]; then
                echo "❌ Filename '$filename' doesn't match JSON ID '$json_id' in $file"
                exit 1
            else
                echo "✅ Filename matches ID for $file"
            fi
        fi
    done
}

# Validate that linked portals exist
validate_linked_portals() {
    local files="$1"
    echo "Validating linked portals exist..."
    
    for file in $files; do
        if [[ $file == public/data/places/*.json ]]; then
            # Get portals array from the place file
            portals=$(jq -r '.portals[]?' "$file" 2>/dev/null || true)
            
            if [ ! -z "$portals" ]; then
                while IFS= read -r portal_id; do
                    if [ ! -z "$portal_id" ]; then
                        # Check if portal exists in either overworld or nether
                        overworld_file="public/data/portals/${portal_id}_overworld.json"
                        nether_file="public/data/portals/${portal_id}_nether.json"
                        
                        if [ ! -f "$overworld_file" ] && [ ! -f "$nether_file" ]; then
                            echo "❌ Linked portal '$portal_id' not found (expected $overworld_file or $nether_file) in $file"
                            exit 1
                        else
                            echo "✅ Linked portal '$portal_id' exists for $file"
                        fi
                    fi
                done <<< "$portals"
            fi
        fi
    done
}

# Main validation function
validate_places() {
    local changed_files="$1"
    
    if [ -z "$changed_files" ]; then
        echo "No place files to validate"
        return 0
    fi
    
    validate_places_schema "$changed_files"
    check_duplicate_place_ids
    validate_place_filenames "$changed_files"
    validate_linked_portals "$changed_files"
    
    echo "🎉 All place validations passed!"
}

# Run validation if script is called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    if [ $# -eq 0 ]; then
        echo "Usage: $0 'file1.json file2.json ...'"
        exit 1
    fi
    validate_places "$1"
fi