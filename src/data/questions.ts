import type { Subject } from '../types';
import { parseQuestions } from './parse';

// Pull every markdown bank from /assets as raw strings at build time.
const files = import.meta.glob('/assets/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Map each source file to subject metadata + a stable id / display order.
const SUBJECT_META: { match: string; id: string; name: string; subtitle: string; order: number }[] = [
  { match: '解剖', id: 'anatomy', name: '解剖', subtitle: 'Anatomy', order: 0 },
  { match: '组织', id: 'histology', name: '组织学', subtitle: 'Histology', order: 1 },
  { match: '生理', id: 'physiology', name: '生理', subtitle: 'Physiology', order: 2 },
];

function buildSubjects(): Subject[] {
  const subjects: (Subject & { _order: number })[] = [];

  for (const [path, content] of Object.entries(files)) {
    const meta = SUBJECT_META.find((m) => path.includes(m.match));
    if (!meta) continue;
    subjects.push({
      id: meta.id,
      name: meta.name,
      subtitle: meta.subtitle,
      questions: parseQuestions(content, meta.id),
      _order: meta.order,
    });
  }

  return subjects
    .sort((a, b) => a._order - b._order)
    .map(({ _order, ...subject }) => subject);
}

export const subjects: Subject[] = buildSubjects();

export const subjectMap: Record<string, Subject> = Object.fromEntries(
  subjects.map((s) => [s.id, s]),
);
