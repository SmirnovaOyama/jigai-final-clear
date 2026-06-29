import { House, SearchIcon, SettingsIcon } from './icons';

interface BottomNavProps {
  active: 'home' | 'search' | 'settings';
  onChange: (tab: 'home' | 'search' | 'settings') => void;
}

const TABS = [
  { id: 'home', label: '主页', Icon: House },
  { id: 'search', label: '搜索', Icon: SearchIcon },
  { id: 'settings', label: '设置', Icon: SettingsIcon },
] as const;

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-tab${active === id ? ' nav-tab--active' : ''}`}
          onClick={() => onChange(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon size={22} />
          <span className="nav-tab-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
