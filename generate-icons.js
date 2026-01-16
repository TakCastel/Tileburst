#!/usr/bin/env node

/**
 * Script pour générer les icônes PWA à partir d'une image source
 * 
 * Usage:
 *   1. Placez une image source (icon-source.png) de 512x512px dans le dossier src/assets/
 *   2. Exécutez: node generate-icons.js
 * 
 * Ou utilisez un service en ligne comme:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'src', 'assets', 'icons');

// Créer le dossier si nécessaire
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('📱 Génération des icônes PWA');
console.log('');
console.log('Pour générer les icônes, vous avez plusieurs options:');
console.log('');
console.log('1. Utiliser un service en ligne:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('   - https://www.favicon-generator.org/');
console.log('');
console.log('2. Utiliser ImageMagick (si installé):');
console.log('   for size in 72 96 128 144 152 192 384 512; do');
console.log('     convert src/assets/icon-source.png -resize ${size}x${size} src/assets/icons/icon-${size}x${size}.png');
console.log('   done');
console.log('');
console.log('3. Utiliser un outil graphique (Photoshop, GIMP, etc.)');
console.log('   pour créer manuellement les icônes aux tailles suivantes:');
sizes.forEach(size => {
  console.log(`   - icon-${size}x${size}.png (${size}x${size}px)`);
});
console.log('');
console.log('Les icônes doivent être placées dans: src/assets/icons/');
console.log('');
console.log('💡 Astuce: Créez une icône de 512x512px avec un fond transparent');
console.log('   et des coins arrondis pour un meilleur rendu sur mobile.');
