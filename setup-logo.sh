#!/bin/bash
# Setup script for astronaut logo
# 
# This script helps you set up the astronaut logo image
# You can either:
# 1. Copy an existing file
# 2. Download from a URL
# 3. Manually save the image to assets/images/astronaut-logo.png

TARGET_DIR="/var/www/prompt-db.dainedvorak.com/assets/images"
TARGET_FILE="$TARGET_DIR/astronaut-logo.png"

echo "==================================="
echo "Prompt DB - Logo Setup Script"
echo "==================================="
echo ""

# Check if file already exists
if [ -f "$TARGET_FILE" ]; then
    echo "✓ Logo file already exists at: $TARGET_FILE"
    echo ""
    ls -lh "$TARGET_FILE"
    exit 0
fi

echo "Logo file not found. Please choose an option:"
echo ""
echo "1. Copy from local file path"
echo "2. Download from URL"
echo "3. Manual instructions"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        read -p "Enter the full path to your astronaut logo image: " source_path
        if [ -f "$source_path" ]; then
            cp "$source_path" "$TARGET_FILE"
            echo "✓ Logo copied successfully!"
            ls -lh "$TARGET_FILE"
        else
            echo "✗ File not found: $source_path"
            exit 1
        fi
        ;;
    2)
        read -p "Enter the URL to download the logo from: " logo_url
        wget -O "$TARGET_FILE" "$logo_url" || curl -o "$TARGET_FILE" "$logo_url"
        if [ -f "$TARGET_FILE" ]; then
            echo "✓ Logo downloaded successfully!"
            ls -lh "$TARGET_FILE"
        else
            echo "✗ Download failed"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo "Manual Setup Instructions:"
        echo "=========================="
        echo "1. Save the astronaut logo image you have"
        echo "2. Name it: astronaut-logo.png"
        echo "3. Place it at: $TARGET_FILE"
        echo ""
        echo "Or use this command:"
        echo "  cp /path/to/your/logo.png $TARGET_FILE"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Setup complete!"
