/**
 * Insert or update 知识点 fields in markdown question banks.
 * Usage: node scripts/patch-knowledge-points.mjs <patches.json>
 *
 * patches.json format:
 * {
 *   "file": "assets/解剖(2).md",
 *   "updates": [
 *     { "number": 1, "knowledgePoint": "独立的知识点内容..." }
 *   ]
 * }
 */
import fs from 'fs';
import path from 'path';

const patchesPath = process.argv[2];
if (!patchesPath) {
  console.error('Usage: node scripts/patch-knowledge-points.mjs <patches.json>');
  process.exit(1);
}

const { file, updates } = JSON.parse(fs.readFileSync(patchesPath, 'utf8'));
const absPath = path.resolve(file);
let content = fs.readFileSync(absPath, 'utf8');

const byNumber = new Map(updates.map((u) => [u.number, u.knowledgePoint.trim()]));
let patched = 0;

content = content.replace(
  /---questionstart\s*([\s\S]*?)\s*---questionend\s*---answerstart\s*([\s\S]*?)\s*---answerend/g,
  (block, qPart, aPart) => {
    const numMatch = qPart.match(/^(\d+)[.、．)]/m);
    if (!numMatch) return block;
    const num = parseInt(numMatch[1], 10);
    const kp = byNumber.get(num);
    if (!kp) return block;

    let newAPart = aPart;
    if (/^知识点[：:]/m.test(newAPart)) {
      newAPart = newAPart.replace(/^知识点[：:]\s*[\s\S]*?(?=^解析[：:]|$)/m, `知识点：${kp}\n`);
    } else if (/^解析[：:]/m.test(newAPart)) {
      newAPart = newAPart.replace(/^(解析[：:])/m, `知识点：${kp}\n$1`);
    } else {
      newAPart = `${newAPart.trim()}\n知识点：${kp}`;
    }

    if (newAPart !== aPart) patched++;
    return `---questionstart\n${qPart.trim()}\n---questionend\n---answerstart\n${newAPart.trim()}\n---answerend`;
  },
);

fs.writeFileSync(absPath, content);
console.log(`Patched ${patched} knowledge points in ${file}`);
