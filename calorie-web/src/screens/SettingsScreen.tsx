import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { testSupabaseConnection } from '../storage/supabase';

export default function SettingsScreen() {
  const { settings, saveSettings, resetAll, apiSettings, saveApiSettings, syncFromSupabase } = useStore();
  const [form, setForm] = useState({
    target_kcal: String(settings.target_kcal),
    target_protein: String(settings.target_protein),
    target_fat: String(settings.target_fat),
    target_carb: String(settings.target_carb),
    target_burn: String(settings.target_burn),
  });
  const [apiForm, setApiForm] = useState({
    openai_api_key: apiSettings.openai_api_key,
    supabase_url: apiSettings.supabase_url,
    supabase_anon_key: apiSettings.supabase_anon_key,
  });
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [supabaseError, setSupabaseError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setForm({
      target_kcal: String(settings.target_kcal),
      target_protein: String(settings.target_protein),
      target_fat: String(settings.target_fat),
      target_carb: String(settings.target_carb),
      target_burn: String(settings.target_burn),
    });
  }, [settings]);

  const handleSave = () => {
    saveSettings({
      target_kcal: parseFloat(form.target_kcal) || 2000,
      target_protein: parseFloat(form.target_protein) || 150,
      target_fat: parseFloat(form.target_fat) || 60,
      target_carb: parseFloat(form.target_carb) || 200,
      target_burn: parseFloat(form.target_burn) || 300,
    });
    alert('目標値を保存しました');
  };

  const handleReset = () => {
    if (confirm('すべての記録・食材・設定を消去します。本当によろしいですか？')) {
      resetAll();
      alert('データをリセットしました');
    }
  };

  const handleSaveApi = () => {
    saveApiSettings({
      openai_api_key: apiForm.openai_api_key.trim(),
      supabase_url: apiForm.supabase_url.trim(),
      supabase_anon_key: apiForm.supabase_anon_key.trim(),
    });
    alert('API設定を保存しました');
  };

  const handleTestSupabase = async () => {
    const url = apiForm.supabase_url.trim();
    const key = apiForm.supabase_anon_key.trim();
    if (!url || !key) {
      alert('Project URL と Anon Key を入力してください');
      return;
    }
    setSupabaseStatus('testing');
    setSupabaseError('');
    try {
      await testSupabaseConnection(url, key);
      setSupabaseStatus('ok');
    } catch (e) {
      setSupabaseStatus('error');
      setSupabaseError(String(e));
    }
  };

  const renderField = (label: string, key: keyof typeof form, unit: string) => (
    <div className="settings-row">
      <div className="settings-label">
        <div className="settings-label-main">{label}</div>
        <div className="settings-label-sub">{unit}</div>
      </div>
      <input
        className="settings-input"
        type="number"
        inputMode="decimal"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="settings-section">
      <div className="settings-title">1日の目標値</div>
      <div className="settings-card">
        {renderField('摂取カロリー', 'target_kcal', 'kcal')}
        {renderField('消費カロリー', 'target_burn', 'kcal')}
        {renderField('タンパク質 P', 'target_protein', 'g')}
        {renderField('脂質 F', 'target_fat', 'g')}
        {renderField('炭水化物 C', 'target_carb', 'g')}
      </div>
      <button className="btn-save" onClick={handleSave}>保存する</button>

      <div className="settings-title">データ管理</div>
      <button className="btn-reset" onClick={handleReset}>すべてのデータをリセット</button>

      <div className="settings-title">アプリ情報</div>
      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-label-main">データ保存先</div>
          <div style={{ color: apiSettings.supabase_url ? '#10b981' : '#9ca3af', fontSize: 14 }}>
            {apiSettings.supabase_url ? 'ブラウザ + Supabase ☁️' : 'ブラウザのみ'}
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label-main">バージョン</div>
          <div style={{ color: '#9ca3af', fontSize: 14 }}>1.0.0</div>
        </div>
      </div>
      {apiSettings.supabase_url ? (
        <p className="note">☁️ データはブラウザとSupabaseの両方に保存されます。</p>
      ) : (
        <p className="note">
          ⚠️ データはこのブラウザにのみ保存されます。<br />
          ブラウザの履歴クリアでデータが消えます。
        </p>
      )}
      <div className="settings-title">AI機能設定</div>
      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-label">
            <div className="settings-label-main">OpenAI API キー</div>
            <div className="settings-label-sub">AIメモ・スクショ解析に使用</div>
          </div>
          <input
            className="settings-input"
            type="password"
            value={apiForm.openai_api_key}
            onChange={e => setApiForm(f => ({ ...f, openai_api_key: e.target.value }))}
            placeholder="sk-..."
          />
        </div>
      </div>

      <div className="settings-title">クラウド同期（Supabase）</div>
      <div className="settings-card">
        <div className="settings-row">
          <div className="settings-label">
            <div className="settings-label-main">Project URL</div>
          </div>
          <input
            className="settings-input"
            type="text"
            value={apiForm.supabase_url}
            onChange={e => setApiForm(f => ({ ...f, supabase_url: e.target.value }))}
            placeholder="https://xxx.supabase.co"
          />
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <div className="settings-label-main">Anon Key</div>
          </div>
          <input
            className="settings-input"
            type="password"
            value={apiForm.supabase_anon_key}
            onChange={e => setApiForm(f => ({ ...f, supabase_anon_key: e.target.value }))}
            placeholder="eyJ..."
          />
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-save"
            style={{ flex: 1, marginBottom: 0 }}
            onClick={handleTestSupabase}
            disabled={supabaseStatus === 'testing'}
          >
            {supabaseStatus === 'testing' ? '接続中...' : '接続テスト'}
          </button>
          <button
            className="btn-save"
            style={{ flex: 1, marginBottom: 0, background: '#0891b2' }}
            disabled={syncing || !apiSettings.supabase_url}
            onClick={async () => {
              setSyncing(true);
              try {
                await syncFromSupabase();
                alert('同期が完了しました');
              } catch (e) {
                alert(`同期に失敗しました: ${String(e)}`);
              } finally {
                setSyncing(false);
              }
            }}
          >
            {syncing ? '同期中...' : 'データを同期'}
          </button>
        </div>
        {supabaseStatus === 'ok' && (
          <p style={{ color: '#10b981', fontSize: 13, marginTop: 6 }}>✅ 接続成功</p>
        )}
        {supabaseStatus === 'error' && (
          <p style={{ color: '#ef4444', fontSize: 13, marginTop: 6 }}>{supabaseError}</p>
        )}
      </div>
      <button className="btn-save" onClick={handleSaveApi}>API設定を保存</button>

      <div style={{ height: 40 }} />
    </div>
  );
}
