import { useCallback, useEffect, useMemo, useState } from 'react';
import { subjects, subjectMap } from './data/questions';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { DeckItem, DeckSession, HistoryEntry, Question, Session } from './types';
import { Home } from './components/Home';
import { Quiz } from './components/Quiz';
import { Results } from './components/Results';

type View = 'home' | 'quiz' | 'results';
type Theme = 'light' | 'dark';
type ActiveKind = 'subject' | 'deck';
export type RestartMode = 'all' | 'shuffle' | 'wrong';
export type DeckKind = 'today' | 'all' | 'wrong';

type SessionMap = Record<string, Session>;
type History = Record<string, HistoryEntry>;
interface Settings {
  dailyGoal: number;
}
type Activity = Record<string, number>;

const DECK_TITLES: Record<DeckKind, string> = {
  today: '今日回顾',
  all: '重做做过的题',
  wrong: '重做错题',
};

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeSession(count: number, mode: 'all' | 'shuffle', subset?: number[]): Session {
  const seq = subset ?? Array.from({ length: count }, (_, i) => i);
  return {
    order: mode === 'shuffle' ? shuffle(seq) : seq,
    position: 0,
    answers: {},
  };
}

/** Parse a question id ("anatomy-15") back into a subject + index. */
function parseQid(qid: string): { subjectId: string; qIndex: number } | null {
  const dash = qid.lastIndexOf('-');
  if (dash < 0) return null;
  return { subjectId: qid.slice(0, dash), qIndex: Number(qid.slice(dash + 1)) };
}

/** Build a list of deck items from the answer history, filtered by kind. */
function deckItemsFromHistory(history: History, kind: DeckKind): DeckItem[] {
  const today = todayKey();
  const items: DeckItem[] = [];
  for (const [qid, h] of Object.entries(history)) {
    const ref = parseQid(qid);
    if (!ref) continue;
    const subject = subjectMap[ref.subjectId];
    const q = subject?.questions[ref.qIndex];
    if (!q) continue;
    if (kind === 'today' && h.d !== today) continue;
    if (kind === 'wrong' && h.pick === q.answer) continue;
    items.push({ subjectId: ref.subjectId, qIndex: ref.qIndex });
  }
  return items;
}

export default function App() {
  const initialTheme =
    (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
  const [theme, setTheme] = useLocalStorage<Theme>('quiz.theme', initialTheme);
  const [sessions, setSessions] = useLocalStorage<SessionMap>('quiz.sessions.v2', {});
  const [settings, setSettings] = useLocalStorage<Settings>('quiz.settings.v1', {
    dailyGoal: 20,
  });
  const [activity, setActivity] = useLocalStorage<Activity>('quiz.activity.v1', {});
  const [history, setHistory] = useLocalStorage<History>('quiz.history.v1', {});
  const [deck, setDeck] = useLocalStorage<DeckSession | null>('quiz.deck.v1', null);

  const [view, setView] = useState<View>('home');
  const [activeKind, setActiveKind] = useState<ActiveKind>('subject');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    [setTheme],
  );

  // Record any answer into the cumulative history + daily activity.
  const recordAnswer = useCallback(
    (q: Question, label: string) => {
      const d = todayKey();
      setHistory((prev) => ({ ...prev, [q.id]: { d, pick: label } }));
      setActivity((prev) => ({ ...prev, [d]: (prev[d] || 0) + 1 }));
    },
    [setHistory, setActivity],
  );

  // ---- Subject practice ------------------------------------------------
  const openSubject = useCallback(
    (id: string) => {
      const subject = subjectMap[id];
      if (!subject) return;
      setSessions((prev) =>
        prev[id] ? prev : { ...prev, [id]: makeSession(subject.questions.length, 'all') },
      );
      setActiveKind('subject');
      setActiveId(id);
      setView('quiz');
    },
    [setSessions],
  );

  // ---- Review decks ----------------------------------------------------
  const startDeck = useCallback(
    (kind: DeckKind) => {
      const items = shuffle(deckItemsFromHistory(history, kind));
      if (!items.length) return;
      setDeck({ title: DECK_TITLES[kind], items, position: 0, answers: {} });
      setActiveKind('deck');
      setView('quiz');
    },
    [history, setDeck],
  );

  const goHome = useCallback(() => {
    setView('home');
    setActiveId(null);
  }, []);

  // ---- Unified handlers (dispatch on the active kind) ------------------
  const handleSelect = useCallback(
    (position: number, label: string) => {
      if (activeKind === 'subject') {
        if (!activeId) return;
        const s = sessions[activeId];
        const subject = subjectMap[activeId];
        if (!s || !subject) return;
        const qIdx = s.order[position];
        if (s.answers[qIdx] !== undefined) return; // locked
        setSessions((prev) => ({
          ...prev,
          [activeId]: { ...prev[activeId], answers: { ...prev[activeId].answers, [qIdx]: label } },
        }));
        recordAnswer(subject.questions[qIdx], label);
      } else if (deck) {
        if (deck.answers[position] !== undefined) return;
        const item = deck.items[position];
        const q = subjectMap[item.subjectId]?.questions[item.qIndex];
        if (!q) return;
        setDeck((prev) =>
          prev ? { ...prev, answers: { ...prev.answers, [position]: label } } : prev,
        );
        recordAnswer(q, label);
      }
    },
    [activeKind, activeId, sessions, deck, setSessions, setDeck, recordAnswer],
  );

  const handleGoTo = useCallback(
    (position: number) => {
      if (activeKind === 'subject') {
        if (!activeId) return;
        setSessions((prev) => {
          const s = prev[activeId];
          if (!s) return prev;
          const clamped = Math.max(0, Math.min(position, s.order.length - 1));
          return { ...prev, [activeId]: { ...s, position: clamped } };
        });
      } else {
        setDeck((prev) => {
          if (!prev) return prev;
          const clamped = Math.max(0, Math.min(position, prev.items.length - 1));
          return { ...prev, position: clamped };
        });
      }
    },
    [activeKind, activeId, setSessions, setDeck],
  );

  const handleRestart = useCallback(
    (mode: RestartMode) => {
      if (activeKind === 'subject') {
        const subject = activeId ? subjectMap[activeId] : null;
        if (!activeId || !subject) return;
        const count = subject.questions.length;
        if (mode === 'wrong') {
          const current = sessions[activeId];
          const wrong = current
            ? current.order.filter((idx) => {
                const picked = current.answers[idx];
                return picked !== undefined && picked !== subject.questions[idx].answer;
              })
            : [];
          const subset = wrong.length ? wrong : current?.order.slice();
          setSessions((prev) => ({ ...prev, [activeId]: makeSession(count, 'shuffle', subset) }));
        } else {
          setSessions((prev) => ({
            ...prev,
            [activeId]: makeSession(count, mode === 'shuffle' ? 'shuffle' : 'all'),
          }));
        }
      } else if (deck) {
        let items = deck.items;
        if (mode === 'wrong') {
          const wrong = deck.items.filter((it, pos) => {
            const picked = deck.answers[pos];
            const q = subjectMap[it.subjectId]?.questions[it.qIndex];
            return picked !== undefined && q && picked !== q.answer;
          });
          if (wrong.length) items = wrong;
        }
        setDeck({ ...deck, items: shuffle(items), position: 0, answers: {} });
      }
      setView('quiz');
    },
    [activeKind, activeId, sessions, deck, setSessions, setDeck],
  );

  const setDailyGoal = useCallback(
    (goal: number) => setSettings((s) => ({ ...s, dailyGoal: goal })),
    [setSettings],
  );

  // ---- Derived stats from history --------------------------------------
  const stats = useMemo(() => {
    const today = todayKey();
    const perSubject: Record<string, { answered: number; correct: number; total: number }> = {};
    for (const s of subjects) {
      perSubject[s.id] = { answered: 0, correct: 0, total: s.questions.length };
    }
    let todayDone = 0;
    let wrong = 0;
    let done = 0;
    for (const [qid, h] of Object.entries(history)) {
      const ref = parseQid(qid);
      if (!ref) continue;
      const q = subjectMap[ref.subjectId]?.questions[ref.qIndex];
      if (!q) continue;
      done++;
      const ok = h.pick === q.answer;
      perSubject[ref.subjectId].answered++;
      if (ok) perSubject[ref.subjectId].correct++;
      else wrong++;
      if (h.d === today) todayDone++;
    }
    return { perSubject, todayDone, wrong, done };
  }, [history]);

  const streak = useMemo(() => {
    const key = (date: Date) => date.toLocaleDateString('en-CA');
    const d = new Date();
    if (!activity[key(d)]) d.setDate(d.getDate() - 1);
    let n = 0;
    while (activity[key(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }, [activity]);

  // ---- Resolve the active quiz/results into position-indexed arrays -----
  const active = useMemo(() => {
    if (activeKind === 'subject') {
      const subject = activeId ? subjectMap[activeId] : null;
      const session = activeId ? sessions[activeId] : undefined;
      if (!subject || !session) return null;
      return {
        title: subject.name,
        questions: session.order.map((i) => subject.questions[i]),
        answers: session.order.map((i) => session.answers[i]),
        position: session.position,
        contextLabels: undefined as (string | undefined)[] | undefined,
      };
    }
    if (deck) {
      return {
        title: deck.title,
        questions: deck.items.map((it) => subjectMap[it.subjectId].questions[it.qIndex]),
        answers: deck.items.map((_, pos) => deck.answers[pos]),
        position: deck.position,
        contextLabels: deck.items.map((it) => subjectMap[it.subjectId].name),
      };
    }
    return null;
  }, [activeKind, activeId, sessions, deck]);

  return (
    <div className="app">
      {view === 'home' && (
        <Home
          subjects={subjects}
          progress={stats.perSubject}
          todayDone={stats.todayDone}
          doneCount={stats.done}
          wrongCount={stats.wrong}
          dailyGoal={settings.dailyGoal}
          streak={streak}
          onSetGoal={setDailyGoal}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpen={openSubject}
          onStartDeck={startDeck}
        />
      )}

      {view === 'quiz' && active && (
        <Quiz
          title={active.title}
          questions={active.questions}
          answers={active.answers}
          position={active.position}
          contextLabels={active.contextLabels}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelect={handleSelect}
          onGoTo={handleGoTo}
          onExit={goHome}
          onShowResults={() => setView('results')}
        />
      )}

      {view === 'results' && active && (
        <Results
          title={active.title}
          questions={active.questions}
          answers={active.answers}
          contextLabels={active.contextLabels}
          theme={theme}
          onToggleTheme={toggleTheme}
          onExit={goHome}
          onReview={() => setView('quiz')}
          onRestart={handleRestart}
          onJump={(position) => {
            handleGoTo(position);
            setView('quiz');
          }}
        />
      )}
    </div>
  );
}
