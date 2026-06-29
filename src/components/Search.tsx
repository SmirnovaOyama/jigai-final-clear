import { useMemo, useState } from 'react';
import type { DeckItem } from '../types';
import { searchQuestions, stripMarkup } from '../data/searchQuestions';
import { ChevronRight, Close, SearchIcon } from './icons';

interface SearchProps {
  favorites: Record<string, boolean>;
  onOpenQuestion: (item: DeckItem) => void;
}

function truncate(text: string, max = 72): string {
  const plain = stripMarkup(text).replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max)}…`;
}

export function Search({ favorites, onOpenQuestion }: SearchProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchQuestions(query), [query]);
  const trimmed = query.trim();

  return (
    <main className="container home has-bottom-nav">
      <section className="hero">
        <h1 className="greeting">搜索</h1>
        <p className="hero-line">在题干、选项、知识点和解析中查找题目</p>
      </section>

      <section className="home-section">
        <div className="search-bar">
          <SearchIcon size={18} className="search-bar-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="输入关键词，如「红细胞」「负反馈」"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索题目"
            enterKeyHint="search"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery('')}
              aria-label="清空搜索"
            >
              <Close size={16} />
            </button>
          )}
        </div>
      </section>

      {trimmed && (
        <section className="home-section">
          <h2 className="group-label">
            {results.length > 0 ? `找到 ${results.length} 道题` : '未找到匹配题目'}
          </h2>
          {results.length > 0 && (
            <div className="list">
              {results.map((hit) => (
                <button
                  key={hit.question.id}
                  type="button"
                  className="list-row"
                  onClick={() =>
                    onOpenQuestion({ subjectId: hit.subjectId, qIndex: hit.qIndex })
                  }
                >
                  <span className="row-main">
                    <span className="row-title">
                      第 {hit.question.number} 题 · {hit.subjectName}
                      {favorites[hit.question.id] && (
                        <span className="search-fav" aria-label="已收藏">
                          {' '}★
                        </span>
                      )}
                    </span>
                    <span className="row-sub">{truncate(hit.question.stem)}</span>
                  </span>
                  <span className="row-go" aria-hidden="true">
                    <ChevronRight size={18} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {!trimmed && (
        <p className="search-hint">支持搜索题干、选项、知识点和解析中的关键词</p>
      )}
    </main>
  );
}
