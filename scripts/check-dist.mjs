// Post-build guard: dist/ must not contain anything from assets/references/ (private photos),
// and should not contain any raster photos at all (every sprite is generated in code).
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const refs = path.resolve('assets/references');
const refNames = new Set();
if (fs.existsSync(refs)) {
  for (const f of walk(refs)) refNames.add(path.basename(f).toLowerCase());
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const bad = [];
for (const f of walk(dist)) {
  const rel = path.relative(dist, f);
  if (/\.(png|jpe?g|gif|webp|heic|bmp)$/i.test(f)) bad.push(`${rel} (image file)`);
  if (/references/i.test(rel)) bad.push(`${rel} (references path)`);
  const text = fs.readFileSync(f, 'latin1');
  if (/assets[\/]references/i.test(text)) bad.push(`${rel} (mentions assets/references)`);
}
if (bad.length) {
  console.error('dist/ check FAILED:\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log(`dist/ check passed: ${walk(dist).length} files, no reference photos or images (${refNames.size} private references excluded).`);
