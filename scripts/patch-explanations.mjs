/**
 * Patch 解析 fields in markdown question banks.
 * Usage: node scripts/patch-explanations.mjs <patches.json>
 *
 * patches.json format:
 * {
 *   "file": "assets/解剖(2).md",
 *   "updates": [
 *     { "number": 1, "explanation": "详细解析..." }
 *   ]
 * }
 */
import fs from 'fs';
import path from 'path';

const patchesPath = process.argv[2];
if (!patchesPath) {
  console.error('Usage: node scripts/patch-explanations.mjs <patches.json>');
  process.exit(1);
}

const { file, updates } = JSON.parse(fs.readFileSync(patchesPath, 'utf8'));
const absPath = path.resolve(file);
let content = fs.readFileSync(absPath, 'utf8');

const byNumber = new Map(updates.map((u) => [u.number, u.explanation]));
let patched = 0;

content = content.replace(
  /---questionstart\s*([\s\S]*?)\s*---questionend\s*---answerstart\s*([\s\S]*?)\s*---answerend/g,
  (block, qPart, aPart) => {
    const numMatch = qPart.match(/^(\d+)[.、．)]/m);
    if (!numMatch) return block;
    const num = parseInt(numMatch[1], 10);
    const newExpl = byNumber.get(num);
    if (!newExpl) return block;

    const newAPart = aPart.replace(
      /^解析[：:]\s*[\s\S]*/m,
      `解析：${newExpl.trim()}`,
    );
    if (newAPart !== aPart) patched++;
    return `---questionstart\n${qPart.trim()}\n---questionend\n---answerstart\n${newAPart.trim()}\n---answerend`;
  },
);

fs.writeFileSync(absPath, content);
console.log(`Patched ${patched} explanations in ${file}`);
