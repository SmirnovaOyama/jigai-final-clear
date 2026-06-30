import { useMemo, useState } from 'react';
import type { Subject } from '../types';
import { Close } from './icons';

interface MemorizePickerProps {
  subjects: Subject[];
  eligibleBySubject: Record<string, number>;
  count: number;
  onConfirm: (subjectIds: string[]) => void;
  onClose: () => void;
}

export function MemorizePicker({
  subjects,
  eligibleBySubject,
  count,
  onConfirm,
  onClose,
}: MemorizePickerProps) {
  const defaultSelected = useMemo(
    () => subjects.filter((s) => (eligibleBySubject[s.id] ?? 0) > 0).map((s) => s.id),
    [subjects, eligibleBySubject],
  );
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));

  const selectedEligible = useMemo(
    () =>
      subjects.reduce(
        (n, s) => (selected.has(s.id) ? n + (eligibleBySubject[s.id] ?? 0) : n),
        0,
      ),
    [subjects, eligibleBySubject, selected],
  );

  const sessionCount = Math.min(count, selectedEligible);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet-panel"
        role="dialog"
        aria-label="选择背答案范围"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h3>选择科目</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <Close size={18} />
          </button>
        </div>
        <p className="sheet-desc">只从未做过的题中抽取，可多选</p>

        <div className="sheet-list">
          {subjects.map((subject) => {
            const remaining = eligibleBySubject[subject.id] ?? 0;
            const on = selected.has(subject.id);
            const disabled = remaining === 0;
            return (
              <button
                key={subject.id}
                type="button"
                className={`sheet-row${on ? ' sheet-row--on' : ''}`}
                disabled={disabled}
                onClick={() => !disabled && toggle(subject.id)}
              >
                <span className="sheet-row-main">
                  <span className="sheet-row-title">{subject.name}</span>
                  <span className="sheet-row-sub">
                    {remaining > 0 ? `剩余 ${remaining} 题未做` : '已全部做过'}
                  </span>
                </span>
                <span
                  className={`sheet-check${on ? ' sheet-check--on' : ''}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn--primary sheet-action"
          disabled={selected.size === 0 || selectedEligible === 0}
          onClick={() => onConfirm([...selected])}
        >
          {selectedEligible > 0 ? `开始背答案 · ${sessionCount} 题` : '请选择科目'}
        </button>
      </div>
    </div>
  );
}
