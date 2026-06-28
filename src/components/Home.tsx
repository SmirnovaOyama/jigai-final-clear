import type { DeckKind } from '../App';
import type { Subject } from '../types';
import { ChevronRight, Spark } from './icons';

interface HomeProps {
  subjects: Subject[];
  progress: Record<string, { answered: number; correct: number; total: number }>;
  todayDone: number;
  doneCount: number;
  wrongCount: number;
  dailyGoal: number;
  streak: number;
  onOpen: (id: string) => void;
  onStartDeck: (kind: DeckKind) => void;
  favorites: Record<string, boolean>;
  flashcardCount: number;
  onStartFlashcard: (count: number) => void;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 13) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export function Home({
  subjects,
  progress,
  todayDone,
  doneCount,
  wrongCount,
  dailyGoal,
  streak,
  onOpen,
  onStartDeck,
  favorites,
  flashcardCount,
  onStartFlashcard,
}: HomeProps) {
  const goalPct = dailyGoal > 0 ? Math.min(100, Math.round((todayDone / dailyGoal) * 100)) : 0;
  const goalDone = todayDone >= dailyGoal;
  const favCount = Object.values(favorites).filter(Boolean).length;

  const reviewRows: { kind: DeckKind; title: string; sub: string; count: number }[] = [
    { kind: 'today', title: '今日回顾', sub: `重做今天做过的 ${todayDone} 题`, count: todayDone },
    { kind: 'wrong', title: '重做错题', sub: `累计 ${wrongCount} 道做错的题`, count: wrongCount },
    { kind: 'all', title: '重做做过的题', sub: `累计 ${doneCount} 道做过的题`, count: doneCount },
    { kind: 'favorites', title: '收藏题目', sub: `收藏了 ${favCount} 道题`, count: favCount },
  ];
  const hasHistory = doneCount > 0 || favCount > 0;

  return (
    <main className="container home has-bottom-nav">
      <section className="hero">
        <h1 className="greeting">{greeting()}</h1>
        <p className="hero-line">
          {goalDone ? (
            <>今天已完成目标，做了 {todayDone} 题 🎉</>
          ) : (
            <>今天已完成 {todayDone} / {dailyGoal} 题</>
          )}
          {streak > 0 && <> · 连续学习 {streak} 天</>}
        </p>
        <div className="goal-bar" aria-hidden="true">
          <div className="goal-bar-fill" style={{ width: `${goalPct}%` }} />
        </div>
      </section>

      {hasHistory && (
        <section className="home-section">
          <h2 className="group-label">温故知新</h2>
          <div className="list">
            {reviewRows.map((row) => (
              <button
                key={row.kind}
                type="button"
                className="list-row"
                disabled={row.count === 0}
                onClick={() => onStartDeck(row.kind)}
              >
                <span className="row-main">
                  <span className="row-title">{row.title}</span>
                  <span className="row-sub">{row.sub}</span>
                </span>
                {row.count > 0 && (
                  <span className="row-go" aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="home-section">
        <h2 className="group-label">学习模式</h2>
        <div className="list">
          <button
            type="button"
            className="list-row"
            onClick={() => onStartFlashcard(flashcardCount)}
          >
            <span className="row-main">
              <span className="row-title fc-entry-title">
                <Spark size={15} className="fc-entry-icon" />
                知识点速览
              </span>
              <span className="row-sub">先看知识点，再做对应题目 · {flashcardCount} 题</span>
            </span>
            <span className="row-go" aria-hidden="true">
              <ChevronRight size={18} />
            </span>
          </button>
        </div>
      </section>

      <section className="home-section">
        <h2 className="group-label">练习</h2>
        <div className="list">
          {subjects.map((subject) => {
            const p = progress[subject.id];
            const accuracy = p.answered ? Math.round((p.correct / p.answered) * 100) : 0;
            return (
              <button
                key={subject.id}
                type="button"
                className="list-row"
                onClick={() => onOpen(subject.id)}
              >
                <span className="row-main">
                  <span className="row-title">{subject.name}</span>
                  <span className="row-sub">
                    {subject.subtitle} · {subject.questions.length} 题
                  </span>
                </span>
                <span className="row-trail">
                  <span className="row-meta">
                    {p.answered > 0 ? `已答 ${p.answered} · ${accuracy}%` : '未开始'}
                  </span>
                  <span className="row-go" aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
