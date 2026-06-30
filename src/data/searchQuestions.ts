import type { Question } from '../types';
import { subjects } from './questions';

export interface SearchHit {
  subjectId: string;
  subjectName: string;
  qIndex: number;
  question: Question;
}

import { normalizeMarkup } from './markup';

/** Strip RichText / highlight markup for plain-text search and display. */
export function stripMarkup(text: string): string {
  return normalizeMarkup(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\^([^^]+)\^/g, '$1')
    .replace(/~([^~]+)~/g, '$1')
    .replace(/==([^=]+)==/g, '$1');
}

function searchableText(q: Question): string {
  return stripMarkup(
    [q.stem, ...q.options.map((o) => o.text), q.knowledgePoint, q.explanation].join(' '),
  ).toLowerCase();
}

/** Search all questions by stem, options, knowledge point, or explanation. */
export function searchQuestions(query: string, limit = 60): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: SearchHit[] = [];
  for (const subject of subjects) {
    for (let i = 0; i < subject.questions.length; i++) {
      const question = subject.questions[i];
      if (searchableText(question).includes(q)) {
        hits.push({
          subjectId: subject.id,
          subjectName: subject.name,
          qIndex: i,
          question,
        });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}
