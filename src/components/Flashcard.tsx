import { useState } from 'react';
import type { Question } from '../types';
import { Header } from './Header';
import { QuestionView } from './QuestionView';
import { RichText } from './RichText';
import { ArrowLeft, ChevronLeft, ChevronRight } from './icons';

export interface FlashcardItem {
  question: Question;
  subjectName: string;
}

interface FlashcardViewProps {
  items: FlashcardItem[];
  position: number;
  phase: 'study' | 'quiz';
  mode: 'knowledge' | 'answer';
  answers: Record<number, string>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onFlip: () => void;
  onAdvanceStudy: () => void;
  onPrev: () => void;
  onStartQuiz: () => void;
  onAnswer: (position: number, label: string, q: Question) => void;
  onNext: () => void;
  onFinish: () => void;
  onExit: () => void;
  favorites: Record<string, boolean>;
  onToggleFavorite: (qid: string) => void;
  shuffleOptions?: boolean;
}

export function FlashcardView({
  items,
  position,
  phase,
  mode,
  answers,
  theme,
  onToggleTheme,
  onFlip,
  onAdvanceStudy,
  onPrev,
  onStartQuiz,
  onAnswer,
  onNext,
  onFinish,
  onExit,
  favorites,
  onToggleFavorite,
  shuffleOptions,
}: FlashcardViewProps) {
  const [showSummary, setShowSummary] = useState(false);
  const total = items.length;
  const current = items[position];
  const isFirst = position <= 0;
  const isLast = position >= total - 1;
  const selectedAnswer = answers[position];
  const answered = selectedAnswer !== undefined;
  const isAnswerMode = mode === 'answer';

  const title = isAnswerMode
    ? phase === 'study'
      ? '背答案'
      : '记忆检验'
    : '知识点速览';

  const studyProgressPct = Math.round(((position + 1) / total) * 100);
  const quizProgressPct = Math.round(
    ((position + (answered ? 1 : 0.5)) / total) * 100,
  );
  const progressPct = phase === 'study' ? studyProgressPct : quizProgressPct;

  const quizDone = isAnswerMode && phase === 'quiz' && showSummary;
  const correctCount = items.reduce((n, it, i) => {
    const pick = answers[i];
    return pick !== undefined && pick === it.question.answer ? n + 1 : n;
  }, 0);

  const studyAction = isAnswerMode
    ? { label: isLast ? '开始检验记忆' : '下一题', onClick: isLast ? onStartQuiz : onAdvanceStudy }
    : { label: '开始答题', onClick: onFlip };

  const quizAction = isLast
    ? isAnswerMode
      ? { label: '查看结果', onClick: () => setShowSummary(true) }
      : { label: '完成学习', onClick: onFinish }
    : {
        label: isAnswerMode ? '下一题' : '下一个知识点',
        onClick: onNext,
      };

  const showFooter =
    quizDone ||
    phase === 'study' ||
    (phase === 'quiz' && (isAnswerMode || answered));

  const footerNextDisabled = phase === 'quiz' && !answered && !quizDone;

  const footerLabel = quizDone
    ? '完成'
    : phase === 'study'
      ? studyAction.label
      : quizAction.label;

  const footerClick = quizDone
    ? onFinish
    : phase === 'study'
      ? studyAction.onClick
      : quizAction.onClick;

  return (
    <div className="fc-page">
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        left={
          <button type="button" className="icon-btn icon-btn--text" onClick={onExit}>
            <ArrowLeft size={18} />
            <span className="icon-btn-label">返回</span>
          </button>
        }
        center={
          <div className="quiz-heading">
            <span className="quiz-heading-name">{title}</span>
            <span className="quiz-heading-meta">
              {phase === 'study' && isAnswerMode
                ? `记忆 ${position + 1} / ${total}`
                : `${position + 1} / ${total}`}
            </span>
          </div>
        }
      />

      <div className="progress-bar" aria-hidden="true">
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <main className={`fc-body container${showFooter ? ' fc-body--footer' : ''}`}>
        {quizDone ? (
          <div className="fc-summary">
            <p className="fc-summary-label">检验完成</p>
            <p className="fc-summary-score">
              {correctCount} <span className="fc-summary-of">/ {total}</span>
            </p>
            <p className="fc-summary-rate">
              正确率 {total > 0 ? Math.round((correctCount / total) * 100) : 0}%
            </p>
          </div>
        ) : phase === 'study' ? (
          <article className="fc-memorize">
            <p className="fc-meta">{current.subjectName}</p>
            {isAnswerMode ? (
              <>
                <h2 className="fc-stem">
                  <RichText text={current.question.stem} />
                </h2>
                <ul className="fc-options">
                  {current.question.options.map((opt) => {
                    const isCorrect = opt.label === current.question.answer;
                    return (
                      <li
                        key={opt.label}
                        className={`fc-option${isCorrect ? ' fc-option--correct' : ''}`}
                      >
                        <span className="fc-option-key">{opt.label}.</span>
                        <span className="fc-option-text">
                          <RichText text={opt.text} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {current.question.explanation && (
                  <div className="fc-detail">
                    <RichText text={current.question.explanation} />
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="fc-stem-hint">
                  考查：<RichText text={current.question.stem} />
                </p>
                <div className="fc-knowledge">
                  <RichText text={current.question.knowledgePoint} />
                </div>
              </>
            )}
          </article>
        ) : (
          <QuestionView
            key={position}
            question={current.question}
            selected={selectedAnswer}
            context={current.subjectName}
            onSelect={(label) => !answered && onAnswer(position, label, current.question)}
            isFavorite={favorites[current.question.id] ?? false}
            onToggleFavorite={() => onToggleFavorite(current.question.id)}
            shuffleOptions={shuffleOptions}
          />
        )}
      </main>

      {showFooter && (
        <footer className="fc-footer">
          <div className={`fc-footer-inner${quizDone ? ' fc-footer-inner--solo' : ''}`}>
            {!quizDone && (
              <button
                type="button"
                className="btn btn--ghost fc-footer-prev"
                disabled={isFirst}
                onClick={onPrev}
                aria-label="上一题"
              >
                <ChevronLeft size={18} />
                上一题
              </button>
            )}
            <button
              type="button"
              className="btn btn--primary fc-footer-next"
              disabled={footerNextDisabled}
              onClick={footerClick}
            >
              {footerLabel}
              {!quizDone && !(phase === 'study' ? isLast && isAnswerMode : isLast) && (
                <ChevronRight size={18} />
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
