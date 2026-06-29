/**
 * Extract all questions to JSON for batch explanation generation.
 * Usage: node scripts/extract-questions.mjs [output.json]
 */
import fs from 'fs';
import path from 'path';

const files = [
  { file: 'assets/解剖(2).md', subject: '解剖' },
  { file: 'assets/组织学(2).md', subject: '组织学' },
  { file: 'assets/生理(2).md', subject: '生理' },
];

const all = [];

for (const { file, subject } of files) {
  const content = fs.readFileSync(path.resolve(file), 'utf8');
  const re =
    /---questionstart\s*([\s\S]*?)\s*---questionend\s*---answerstart\s*([\s\S]*?)\s*---answerend/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const qLines = m[1].trim().split('\n').map((l) => l.trim()).filter(Boolean);
    const numMatch = qLines[0].match(/^(\d+)[.、．)]\s*(.*)$/);
    const number = numMatch ? parseInt(numMatch[1], 10) : all.length + 1;
    const stem = numMatch ? numMatch[2] : qLines[0];

    let answer = '';
    let explanation = '';
    for (const line of m[2].trim().split('\n')) {
      const cm = line.match(/^答案[：:]\s*([A-G])[.．、)]?\s*(.*)$/);
      const jm = line.match(/^答案[：:]\s*(正确|错误|对|错|√|×|✓|✗)\s*$/);
      const em = line.match(/^解析[：:]\s*(.*)$/);
      if (cm) answer = cm[1];
      else if (jm) answer = /正确|对|√|✓/.test(jm[1]) ? 'T' : 'F';
      else if (em) explanation = em[1];
    }

    all.push({ file, subject, number, stem, options: qLines.slice(1).join(' '), answer, explanation });
  }
}

const out = process.argv[2] || 'scripts/questions.json';
fs.writeFileSync(out, JSON.stringify(all, null, 2));
console.log(`Extracted ${all.length} questions → ${out}`);
