# PWA Icon Generator Script
# This script generates all required icon sizes for the PWA

# You'll need to:
# 1. Create a high-resolution logo (at least 512x512px) and save it as 'app-logo.png' in this directory
# 2. Install ImageMagick: sudo apt-get install imagemagick (Ubuntu/Debian) or brew install imagemagick (Mac)
# 3. Run this script: bash generate-icons.sh

mkdir -p public/icons

# Check if source logo exists
if [ ! -f "app-logo.png" ]; then
    echo "Error: app-logo.png not found!"
    echo "Please create a 512x512px logo and save it as app-logo.png"
    exit 1
fi

# Generate all icon sizes
echo "Generating PWA icons..."

convert app-logo.png -resize 72x72 public/icons/icon-72x72.png
convert app-logo.png -resize 96x96 public/icons/icon-96x96.png
convert app-logo.png -resize 128x128 public/icons/icon-128x128.png
convert app-logo.png -resize 144x144 public/icons/icon-144x144.png
convert app-logo.png -resize 152x152 public/icons/icon-152x152.png
convert app-logo.png -resize 192x192 public/icons/icon-192x192.png
convert app-logo.png -resize 384x384 public/icons/icon-384x384.png
convert app-logo.png -resize 512x512 public/icons/icon-512x512.png

echo "✓ All icons generated successfully in public/icons/"
echo ""
echo "Icon sizes created:"
ls -lh public/icons/
