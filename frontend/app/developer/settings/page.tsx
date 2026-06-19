'use client'
import DevSidebar from '@/components/developer/DevSidebar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Save } from 'lucide-react';

function SettingsForm({ settings, onChange }: { settings: any, onChange: (val: any) => void }) {
  const handleInput = (e: any) => {
    const { name, value, type, checked } = e.target;
    onChange({ ...settings, [name]: type === 'checkbox' ? checked : value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col text-sm text-slate-400">
          Full Name
          <input
            name="full_name"
            type="text"
            value={settings.full_name || ''}
            onChange={handleInput}
            className="mt-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 text-white placeholder:text-slate-600 focus:outline-none"
          />
        </label>
        <label className="flex flex-col text-sm text-slate-400">
          Email
          <input
            name="email"
            type="email"
            value={settings.email || ''}
            onChange={handleInput}
            className="mt-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-2 text-white placeholder:text-slate-600 focus:outline-none"
          />
        </label>
      </div>
      <label className="flex items-center space-x-2 text-sm text-slate-400">
        <input
          name="notifications"
          type="checkbox"
          checked={settings.notifications ?? false}
          onChange={handleInput}
          className="h-4 w-4 rounded border-white/[0.2] bg-white/[0.04] text-indigo-600 focus:ring-indigo-500"
        />
        <span>Enable email notifications</span>
      </label>
    </div>
  );
}

export default function DeveloperSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('is_authenticated');
    const role = localStorage.getItem('user_role');
    if (auth !== 'true' || role !== 'developer') {
      router.push('/login');
    } else {
      api
        .get('/api/settings')
        .then((data) => setSettings(data))
        .catch((err) => console.error('Failed to load settings', err))
        .finally(() => setLoading(false));
    }
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/settings', settings);
      alert('Settings saved');
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <DevSidebar developerName="Developer" activeClaims={0} unreadMessages={0} />
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-semibold text-white mb-6">Settings</h1>
        <SettingsForm settings={settings} onChange={setSettings} />
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          <Save size={16} />
          Save Changes
        </button>
      </main>
    </div>
  );
}
