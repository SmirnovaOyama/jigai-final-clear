import type { Option, Question, QuestionType } from '../types';

// Separators that may follow an option label, e.g. "A." / "A．" / "A、" / "A)".
const SEPARATORS = '.．、)）:：，,';

const isLatinNum = (ch: string | undefined): boolean =>
  ch !== undefined && /[A-Za-z0-9]/.test(ch);

/**
 * Find the index of an option label (a single letter) used as a marker.
 *
 * The source files are inconsistent: some options are space-separated
 * ("A. 长骨 B短骨"), some are mashed together with no space ("额骨B蝶骨"),
 * and option text can itself contain Latin tokens (O~2~, Na^+^, Purkinje, B12).
 *
 * A position counts as a marker only when the letter is NOT part of a Latin
 * word or number — i.e. it is not preceded by a Latin letter/digit and not
 * immediately followed by one. This catches mashed CJK markers while skipping
 * the "A" inside "ATP" or the "D" inside "DNA".
 */
function findMarker(text: string, letter: string, fromIdx: number): number {
  for (let i = fromIdx; i < text.length; i++) {
    if (text[i] !== letter) continue;
    if (isLatinNum(text[i - 1])) continue;
    if (isLatinNum(text[i + 1])) continue;
    return i;
  }
  return -1;
}

/** Split a block of option text into individual A–E options, in order. */
function splitOptions(text: string): Option[] {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const markers: { label: string; idx: number; textStart: number }[] = [];
  let from = 0;
  for (const label of labels) {
    const idx = findMarker(text, label, from);
    if (idx === -1) break; // labels are sequential; stop at the first gap
    let textStart = idx + 1;
    if (SEPARATORS.includes(text[textStart] ?? '')) textStart++;
    markers.push({ label, idx, textStart });
    from = textStart;
  }

  const options: Option[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].textStart;
    const end = i + 1 < markers.length ? markers[i + 1].idx : text.length;
    const t = text.slice(start, end).trim();
    options.push({ label: markers[i].label, text: t });
  }
  return options;
}

// A line begins the options block if it starts with a label followed by a
// separator/space, or a label glued directly to a CJK character.
const OPTION_LINE = /^[A-G]([\s.．、)）:：]|[㐀-鿿豈-﫿])/;

const QUESTION_BLOCK =
  /---questionstart\s*([\s\S]*?)\s*---questionend\s*---answerstart\s*([\s\S]*?)\s*---answerend/g;

/** Parse one subject's markdown file into a list of questions. */
export function parseQuestions(content: string, subjectId: string): Question[] {
  const questions: Question[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  QUESTION_BLOCK.lastIndex = 0;
  while ((match = QUESTION_BLOCK.exec(content)) !== null) {
    const qLines = match[1]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!qLines.length) continue;

    // First line: "12. stem". Pull the number and the start of the stem.
    const numMatch = qLines[0].match(/^(\d+)[.、．)]\s*(.*)$/);
    const number = numMatch ? parseInt(numMatch[1], 10) : index + 1;
    const stemFirst = numMatch ? numMatch[2] : qLines[0];

    // The stem may span several lines until the options begin.
    let optStart = qLines.length;
    for (let i = 1; i < qLines.length; i++) {
      if (OPTION_LINE.test(qLines[i])) {
        optStart = i;
        break;
      }
    }
    const stem = [stemFirst, ...qLines.slice(1, optStart)].filter(Boolean).join(' ');
    const optionsText = qLines.slice(optStart).join('\n');
    let options = splitOptions(optionsText);

    // Answer block: "答案：C. ..." (choice) or "答案：正确/错误" (judge), plus "解析：...".
    const aLines = match[2]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let answer = '';
    let answerText = '';
    let explanation = '';
    let type: QuestionType = 'choice';

    for (const line of aLines) {
      const choiceMatch = line.match(/^答案[：:]\s*([A-G])[.．、)]?\s*(.*)$/);
      const judgeMatch = line.match(/^答案[：:]\s*(正确|错误|对|错|√|×|✓|✗)\s*$/);
      const explMatch = line.match(/^解析[：:]\s*(.*)$/);

      if (choiceMatch) {
        answer = choiceMatch[1];
        answerText = choiceMatch[2];
      } else if (judgeMatch) {
        type = 'judge';
        const v = judgeMatch[1];
        answer = v === '正确' || v === '对' || v === '√' || v === '✓' ? 'T' : 'F';
      } else if (explMatch) {
        explanation = explMatch[1];
      } else if (explanation) {
        // Continuation of a multi-line explanation.
        explanation += line;
      }
    }

    let cleanStem = stem;
    if (type === 'judge') {
      options = [
        { label: 'T', text: '正确' },
        { label: 'F', text: '错误' },
      ];
      answerText = answer === 'T' ? '正确' : '错误';
      // Drop the trailing "（ ）" placeholder from judge stems.
      cleanStem = stem.replace(/[（(]\s*[)）]\s*[。.]?\s*$/, '').trim();
    }

    questions.push({
      id: `${subjectId}-${index}`,
      number,
      type,
      stem: cleanStem,
      options,
      answer,
      answerText,
      explanation,
    });
    index++;
  }

  return questions;
}
