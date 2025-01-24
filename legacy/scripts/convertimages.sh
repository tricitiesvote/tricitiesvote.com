#!/bin/bash

# Directory containing the PNG images
IMAGE_DIR="static/images/candidates"

# Directory containing the JSON files
JSON_DIR="data/candidates"

# Convert PNG images to optimized JPGs
for file in "$IMAGE_DIR"/*.png; do
    # Get the base name of the file (without extension)
    base_name=$(basename "$file" .png)

    # Convert the image to JPG with sips
    sips -s format jpeg -Z 500 "$file" --out "$IMAGE_DIR/$base_name.jpg"
done

# Replace PNG filenames with JPG filenames in JSON files
for file in "$JSON_DIR"/*.json; do
    # Use sed to replace .png with .jpg in-place
    sed -i '' 's/\.png/\.jpg/g' "$file"
done
