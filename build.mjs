// Netlify build step. Run from the repo root: `node build.mjs`
// 1. Injects FIREBASE_KEY into comms.js (replaces the placeholder).
// 2. Inlines styles.css into every HTML page so first paint needs no
//    extra round trip. Source files stay clean; only the deployed copy changes.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const key = process.env.FIREBASE_KEY;
if (key) {
    const js = readFileSync('comms.js', 'utf8').replace(/FIREBASE_KEY_PLACEHOLDER/g, key);
    writeFileSync('comms.js', js);
    console.log('build: injected FIREBASE_KEY into comms.js');
} else {
    console.warn('build: FIREBASE_KEY not set, leaving placeholder in comms.js');
}

const css = readFileSync('styles.css', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')          // comments
    .replace(/\s+/g, ' ')                          // collapse whitespace
    .replace(/\s*([{}:;,>])\s*/g, '$1')            // trim around punctuation
    .replace(/;}/g, '}')
    .trim();
const linkTag = '<link rel="stylesheet" href="styles.css">';
for (const file of readdirSync('.').filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    if (!html.includes(linkTag)) continue;
    writeFileSync(file, html.replace(linkTag, `<style>\n${css}\n</style>`));
    console.log(`build: inlined styles.css into ${file}`);
}
