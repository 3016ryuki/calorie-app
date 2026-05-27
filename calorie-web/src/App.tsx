import { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import StatsScreen from './screens/StatsScreen';
import FoodsScreen from './screens/FoodsScreen';
import SettingsScreen from './screens/SettingsScreen';

type Tab = 'home' | 'stats' | 'foods' | 'settings';

const TABS: { id: Tab; label: string; icon: string; title: string }[] = [
  { id: 'home', label: 'ホーム', icon: '📋', title: '食事記録' },
  { id: 'stats', label: '統計', icon: '📊', title: '統計' },
  { id: 'foods', label: '食材', icon: '🥗', title: '食材マスター' },
  { id: 'settings', label: '設定', icon: '⚙️', title: '設定' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const current = TABS.find(t => t.id === tab)!;

  return (
    <div className="app">
      <header className="app-header">{current.title}</header>

      <main className="app-content">
        {tab === 'home' && <HomeScreen />}
        {tab === 'stats' && <StatsScreen />}
        {tab === 'foods' && <FoodsScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
