export type QuestionType = 'choice' | 'judge';

export interface Option {
  /** A–E for choice questions, T/F for judge questions. */
  label: string;
  text: string;
}

export interface Question {
  /** Stable id: `${subjectId}-${index}`. */
  id: string;
  /** Original number from the source file (for display). */
  number: number;
  type: QuestionType;
  stem: string;
  options: Option[];
  /** The correct option's label. */
  answer: string;
  /** The correct option's text (as written in the answer line). */
  answerText: string;
  /** Standalone concept for flashcard study — separate from post-answer 解析. */
  knowledgePoint: string;
  explanation: string;
}

export interface Subject {
  id: string;
  /** Chinese display name, e.g. 解剖. */
  name: string;
  /** Short English subtitle, e.g. Anatomy. */
  subtitle: string;
  questions: Question[];
}

/** Per-subject practice session, persisted to localStorage. */
export interface Session {
  /** Indices into Subject.questions, in display order (supports shuffle). */
  order: number[];
  /** Current position within `order`. */
  position: number;
  /** Map of question index -> selected option label. */
  answers: Record<number, string>;
}

/** A reference to one question, used to build cross-subject review decks. */
export interface DeckItem {
  subjectId: string;
  qIndex: number;
}

/** A transient "redo" deck (today's questions, all done, wrong only, …). */
export interface DeckSession {
  title: string;
  items: DeckItem[];
  position: number;
  /** Map of position-in-deck -> selected option label. */
  answers: Record<number, string>;
}

/** What the user last answered for a question, across all sessions. */
export interface HistoryEntry {
  /** Date answered, YYYY-MM-DD (local). */
  d: string;
  /** The option label the user picked. */
  pick: string;
}

/** A "知识点速览" flashcard session: study the knowledge point, then answer the question. */
export interface FlashcardSession {
  items: DeckItem[];
  position: number;
  /** 'study' = knowledge-point card; 'quiz' = question answering. */
  phase: 'study' | 'quiz';
  /** Map of position-in-session -> selected option label. */
  answers: Record<number, string>;
}

