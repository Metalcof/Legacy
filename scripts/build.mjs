import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const originalAssets = new Set([
  'robot-hero.png', 'robot-dark.png', 'cafe-editorial.png', 'creative-conversation.png', 'architecture-editorial.png',
  'headphones-lavanda.png', 'headphones-grafito.png', 'headphones-lima.png',
  'interior-editorial.png', 'coffee-menu.png', 'wellness-editorial.png', 'restaurant-editorial.png', 'professional-editorial.png',
  'case-cafe-flatwhite.png', 'case-cafe-croissant.png', 'case-cafe-iced.png', 'case-cafe-barista.png',
  'case-architecture-patio.png', 'case-architecture-loft.png', 'case-wav-lifestyle.png', 'case-wav-detail.png',
  'case-clinic-consultation.png', 'case-clinic-team.png',
  'case-restaurant-tostadas.png', 'case-restaurant-fish.png', 'case-restaurant-rice.png', 'case-restaurant-cacao.png',
  'case-personal-cosmetics.png', 'case-personal-hotel.png', 'case-personal-workshop.png',
  'auto-cafeteria.png', 'auto-arquitectura.png', 'auto-tienda.png', 'auto-clinica.png', 'auto-restaurante.png', 'auto-personal.png',
]);
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'effects.js', 'project-journey.js', 'config.js', 'assets', 'demos']) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true, filter: source => !originalAssets.has(path.basename(source)) });
}
for (const name of originalAssets) await rm(path.join(output, 'assets', name), { force: true });
await writeFile(path.join(output, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
console.log('Sitio preparado en dist/.');
