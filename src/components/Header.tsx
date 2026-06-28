import type { ReactNode } from 'react';
import { Moon, Sun } from './icons';

interface HeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({ left, center, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-side">{left}</div>
        <div className="header-center">{center}</div>
        <div className="header-side header-side--end">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            title={theme === 'dark' ? '浅色模式' : '深色模式'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
