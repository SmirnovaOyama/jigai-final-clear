import { useMemo } from 'react';
import type { RestartMode } from '../App';
import type { Question } from '../types';
import { Header } from './Header';
import { RichText } from './RichText';
import { ArrowLeft, Refresh } from './icons';

interface ResultsProps {
  title: string;
  questions: Question[];
  answers: (string | undefined)[];
  contextLabels?: (string | undefined)[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onExit: () => void;
  onReview: () => void;
  onRestart: (mode: RestartMode) => void;
  onJump: (position: number) => void;
}

function optionText(q: Question, label: string | undefined): string {
  if (label === undefined) return '未作答';
  return q.options.find((o) => o.label === label)?.text ?? label;
}

export function Results({
  title,
  questions,
  answers,
  contextLabels,
  theme,
  onToggleTheme,
  onExit,
  onReview,
  onRestart,
  onJump,
}: ResultsProps) {
  const summary = useMemo(() => {
    let correct = 0;
    let answered = 0;
    const wrong: number[] = [];
    answers.forEach((picked, pos) => {
      if (picked === undefined) return;
      answered++;
      if (picked === questions[pos].answer) correct++;
      else wrong.push(pos);
    });
    return { correct, answered, wrong, total: questions.length };
  }, [answers, questions]);

  const accuracy = summary.answered
    ? Math.round((summary.correct / summary.answered) * 100)
    : 0;
  const unanswered = summary.total - summary.answered;

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        left={
          <button type="button" className="icon-btn icon-btn--text" onClick={onExit}>
            <ArrowLeft size={18} />
            <span className="icon-btn-label">返回</span>
          </button>
        }
        center={<span className="quiz-heading-name">{title} · 结果</span>}
      />

      <main className="container results">
        <section className="score-card">
          <div className="score-ring">
            <span className="score-pct">{accuracy}%</span>
            <span className="score-label">正确率</span>
          </div>
          <div className="score-stats">
            <div className="score-stat">
              <span className="score-stat-num score-stat-num--correct">{summary.correct}</span>
              <span className="score-stat-label">答对</span>
            </div>
            <div className="score-stat">
              <span className="score-stat-num score-stat-num--wrong">{summary.wrong.length}</span>
              <span className="score-stat-label">答错</span>
            </div>
            <div className="score-stat">
              <span className="score-stat-num">{unanswered}</span>
              <span className="score-stat-label">未答</span>
            </div>
          </div>
        </section>

        <section className="results-actions">
          <button type="button" className="btn btn--primary" onClick={onReview}>
            继续作答
          </button>
          {summary.wrong.length > 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => onRestart('wrong')}>
              <Refresh size={16} />
              重做错题（{summary.wrong.length}）
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={() => onRestart('shuffle')}>
            <Refresh size={16} />
            随机重做
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => onRestart('all')}>
            重做全部
          </button>
        </section>

        {summary.wrong.length > 0 ? (
          <section className="wrong-list">
            <h2 className="section-title">错题回顾（{summary.wrong.length}）</h2>
            {summary.wrong.map((pos) => {
              const q = questions[pos];
              return (
                <article key={pos} className="wrong-item" onClick={() => onJump(pos)}>
                  <div className="wrong-stem">
                    <span className="question-number">
                      第 {q.number} 题{contextLabels?.[pos] ? ` · ${contextLabels[pos]}` : ''}
                    </span>
                    <RichText text={q.stem} />
                  </div>
                  <div className="wrong-answers">
                    <span className="wrong-yours">
                      你的答案：<RichText text={optionText(q, answers[pos])} />
                    </span>
                    <span className="wrong-correct">
                      正确答案：<RichText text={q.answerText} />
                    </span>
                  </div>
                  {q.explanation && (
                    <p className="wrong-explain">
                      <RichText text={q.explanation} />
                    </p>
                  )}
                </article>
              );
            })}
          </section>
        ) : (
          <section className="results-empty">
            {summary.answered === 0
              ? '还没有作答记录，点“继续作答”开始吧。'
              : '全部答对，太棒了 🎉'}
          </section>
        )}
      </main>
    </>
  );
}
