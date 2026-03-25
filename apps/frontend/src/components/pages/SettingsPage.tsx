'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  useSettings,
  useSetProviderKey,
  useSetGeminiServiceAccount,
  useSetGeminiOAuthCredentials,
  useRemoveProvider,
  useClearAllSettings,
  useTestProvider,
  useSetDefaults,
  useGoogleAuthUrl,
  useGoogleCallback,
} from '@/hooks/useSettings';
import { useAppStore } from '@/store/useAppStore';

// ─── Provider Card ─────────────────────────────────────────────────

function ProviderCard({
  name,
  icon,
  config,
  children,
  onClear,
  onTest,
  testResult,
  testPending,
}: {
  name: string;
  icon: string;
  config: any;
  children: React.ReactNode;
  onClear: () => void;
  onTest: () => void;
  testResult?: { connected: boolean } | null;
  testPending: boolean;
}) {
  const isEnabled = config?.enabled;

  return (
    <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-5 transition-all hover:border-[#3a3e55]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-sm">{name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-[#00b894]' : 'bg-[#555878]'}`} />
              <span className={`text-[10px] ${isEnabled ? 'text-[#00b894]' : 'text-[#7b7f9e]'}`}>
                {isEnabled ? 'Connected' : 'Not configured'}
              </span>
              {testResult !== undefined && testResult !== null && (
                <span className={`text-[10px] ml-1 ${testResult.connected ? 'text-[#00b894]' : 'text-[#e17055]'}`}>
                  ({testResult.connected ? 'OK' : 'Failed'})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onTest}
            disabled={!isEnabled || testPending}
            className="px-3 py-1 text-[10px] rounded-lg border border-[#2a2e45] text-[#7b7f9e] hover:text-white hover:border-[#6c5ce7] transition-colors disabled:opacity-30"
          >
            {testPending ? '...' : 'Test'}
          </button>
          <button
            onClick={onClear}
            disabled={!isEnabled}
            className="px-3 py-1 text-[10px] rounded-lg border border-[#2a2e45] text-[#e17055] hover:bg-[rgba(225,112,85,.1)] transition-colors disabled:opacity-30"
          >
            Clear
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── API Key Input ─────────────────────────────────────────────────

function ApiKeyInput({
  provider,
  currentKey,
}: {
  provider: string;
  currentKey?: string;
}) {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const setProviderKey = useSetProviderKey();

  const handleSave = () => {
    if (!key.trim()) return;
    setProviderKey.mutate({ provider, apiKey: key.trim() }, {
      onSuccess: () => setKey(''),
    });
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <input
          type={show ? 'text' : 'password'}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={currentKey || 'Enter API key...'}
          className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555878] focus:outline-none focus:border-[#6c5ce7] pr-16"
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7b7f9e] hover:text-white"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      <button
        onClick={handleSave}
        disabled={!key.trim() || setProviderKey.isPending}
        className="px-4 py-2 text-xs rounded-lg bg-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors disabled:opacity-50"
      >
        {setProviderKey.isPending ? '...' : 'Save'}
      </button>
    </div>
  );
}

// ─── Gemini Auth Section ───────────────────────────────────────────

function GeminiAuthSection({ config }: { config: any }) {
  const [authType, setAuthType] = useState<'api_key' | 'service_account' | 'oauth'>(
    config?.authType || 'api_key',
  );
  const [saJson, setSaJson] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const setServiceAccount = useSetGeminiServiceAccount();
  const setOAuthCreds = useSetGeminiOAuthCredentials();
  const googleAuthUrl = useGoogleAuthUrl();
  const googleCallback = useGoogleCallback();

  // Listen for OAuth callback via message from popup
  const handleOAuthMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type === 'google-oauth-callback' && event.data.code) {
        googleCallback.mutate({
          code: event.data.code,
          redirectUri: `${window.location.origin}/oauth/google/callback`,
        });
      }
    },
    [googleCallback],
  );

  useEffect(() => {
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [handleOAuthMessage]);

  const handleSaveServiceAccount = () => {
    try {
      const parsed = JSON.parse(saJson);
      setServiceAccount.mutate(parsed, { onSuccess: () => setSaJson('') });
    } catch {
      alert('Invalid JSON');
    }
  };

  const handleSaveOAuthCreds = () => {
    if (!clientId.trim() || !clientSecret.trim()) return;
    setOAuthCreds.mutate(
      { clientId: clientId.trim(), clientSecret: clientSecret.trim() },
      { onSuccess: () => { setClientId(''); setClientSecret(''); } },
    );
  };

  const handleGoogleLogin = async () => {
    const redirectUri = `${window.location.origin}/oauth/google/callback`;
    googleAuthUrl.mutate(redirectUri, {
      onSuccess: (data) => {
        window.open(data.url, 'google-oauth', 'width=500,height=600');
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        setServiceAccount.mutate(parsed);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      {/* Auth type selector */}
      <div className="flex gap-2">
        {[
          { value: 'api_key', label: 'API Key' },
          { value: 'service_account', label: 'Service Account' },
          { value: 'oauth', label: 'OAuth' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setAuthType(opt.value as any)}
            className={`px-3 py-1.5 text-[10px] rounded-lg border transition-colors ${
              authType === opt.value
                ? 'border-[#6c5ce7] bg-[rgba(108,92,231,.15)] text-[#a29bfe]'
                : 'border-[#2a2e45] text-[#7b7f9e] hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* API Key form */}
      {authType === 'api_key' && (
        <ApiKeyInput provider="gemini" currentKey={config?.apiKey} />
      )}

      {/* Service Account form */}
      {authType === 'service_account' && (
        <div className="space-y-2">
          {config?.serviceAccount?._masked && (
            <div className="text-[10px] text-[#00b894]">
              Service account loaded (project: {config.serviceAccount.project_id})
            </div>
          )}
          <div className="flex gap-2">
            <label className="px-4 py-2 text-xs rounded-lg border border-[#2a2e45] text-[#7b7f9e] hover:text-white hover:border-[#6c5ce7] transition-colors cursor-pointer">
              Upload JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <span className="text-[10px] text-[#555878] self-center">or paste below:</span>
          </div>
          <textarea
            value={saJson}
            onChange={(e) => setSaJson(e.target.value)}
            placeholder='{"type": "service_account", "project_id": "...", ...}'
            rows={4}
            className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555878] focus:outline-none focus:border-[#6c5ce7] resize-none font-mono"
          />
          <button
            onClick={handleSaveServiceAccount}
            disabled={!saJson.trim() || setServiceAccount.isPending}
            className="px-4 py-2 text-xs rounded-lg bg-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors disabled:opacity-50"
          >
            {setServiceAccount.isPending ? 'Saving...' : 'Save Service Account'}
          </button>
        </div>
      )}

      {/* OAuth form */}
      {authType === 'oauth' && (
        <div className="space-y-3">
          {config?.oauthTokens?._connected && (
            <div className="text-[10px] text-[#00b894]">
              OAuth connected (expires: {config.oauthTokens.expiry || 'unknown'})
            </div>
          )}

          <div className="text-[10px] text-[#7b7f9e] mb-1">Google Cloud OAuth Credentials</div>
          <div className="flex gap-2">
            <input
              type="password"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder={config?.googleClientId || 'Client ID'}
              className="flex-1 bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555878] focus:outline-none focus:border-[#6c5ce7]"
            />
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder={config?.googleClientSecret || 'Client Secret'}
              className="flex-1 bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555878] focus:outline-none focus:border-[#6c5ce7]"
            />
            <button
              onClick={handleSaveOAuthCreds}
              disabled={!clientId.trim() || !clientSecret.trim() || setOAuthCreds.isPending}
              className="px-4 py-2 text-xs rounded-lg bg-[#6c5ce7] text-white hover:bg-[#7c6cf0] transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleAuthUrl.isPending}
            className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg border border-[#2a2e45] text-white hover:border-[#6c5ce7] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleAuthUrl.isPending ? 'Opening...' : 'Login with Google'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────

const MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', provider: 'Anthropic' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', provider: 'Anthropic' },
  { value: 'claude-haiku-35-20241022', label: 'Claude Haiku 3.5', provider: 'Anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google' },
  { value: 'gemini-2.5-pro-preview-06-05', label: 'Gemini 2.5 Pro', provider: 'Google' },
  { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash', provider: 'Google' },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const clearAll = useClearAllSettings();
  const removeProv = useRemoveProvider();
  const testProv = useTestProvider();
  const setDefaults = useSetDefaults();
  const [testResults, setTestResults] = useState<Record<string, { connected: boolean } | null>>({});
  const { useMockData, setUseMockData } = useAppStore();

  const handleTest = (provider: string) => {
    testProv.mutate(provider, {
      onSuccess: (data) => setTestResults((prev) => ({ ...prev, [provider]: data })),
      onError: () => setTestResults((prev) => ({ ...prev, [provider]: { connected: false } })),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-[#181c2e] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const providers = settings?.providers || {};

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-lg font-bold mb-2">Settings</h2>

      {/* Data Source Toggle */}
      <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Data Source</h3>
            <p className="text-[10px] text-[#7b7f9e] mt-0.5">
              {useMockData
                ? 'Using mock data. Switch to API to connect to the backend.'
                : 'Using live API. Backend must be running.'}
            </p>
          </div>
          <button
            onClick={() => setUseMockData(!useMockData)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              useMockData ? 'bg-[#555878]' : 'bg-[#6c5ce7]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                useMockData ? 'left-0.5' : 'left-[26px]'
              }`}
            />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <span className={`text-[10px] px-2 py-0.5 rounded ${useMockData ? 'bg-[rgba(108,92,231,.15)] text-[#a29bfe]' : 'text-[#555878]'}`}>
            Mock
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded ${!useMockData ? 'bg-[rgba(0,184,148,.15)] text-[#00b894]' : 'text-[#555878]'}`}>
            Live API
          </span>
        </div>
      </div>

      {/* Provider Settings */}
      <h3 className="text-sm font-semibold mt-6 mb-2 text-[#7b7f9e]">AI Providers</h3>
      <p className="text-xs text-[#7b7f9e] mb-4">
        Configure API keys for AI providers. Stored as a local JSON file.
      </p>

      {/* Anthropic */}
      <ProviderCard
        name="Anthropic"
        icon="A"
        config={providers.anthropic}
        onClear={() => removeProv.mutate('anthropic')}
        onTest={() => handleTest('anthropic')}
        testResult={testResults.anthropic}
        testPending={testProv.isPending}
      >
        <ApiKeyInput provider="anthropic" currentKey={providers.anthropic?.apiKey} />
      </ProviderCard>

      {/* OpenAI */}
      <ProviderCard
        name="OpenAI"
        icon="O"
        config={providers.openai}
        onClear={() => removeProv.mutate('openai')}
        onTest={() => handleTest('openai')}
        testResult={testResults.openai}
        testPending={testProv.isPending}
      >
        <ApiKeyInput provider="openai" currentKey={providers.openai?.apiKey} />
      </ProviderCard>

      {/* Gemini */}
      <ProviderCard
        name="Google Gemini"
        icon="G"
        config={providers.gemini}
        onClear={() => removeProv.mutate('gemini')}
        onTest={() => handleTest('gemini')}
        testResult={testResults.gemini}
        testPending={testProv.isPending}
      >
        <GeminiAuthSection config={providers.gemini} />
      </ProviderCard>

      {/* Defaults */}
      <div className="bg-[#181c2e] border border-[#2a2e45] rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-4">Defaults</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-[#7b7f9e] uppercase tracking-wider block mb-1">Default Model</label>
            <select
              value={settings?.defaults?.model || 'claude-sonnet-4-20250514'}
              onChange={(e) => setDefaults.mutate({ model: e.target.value })}
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6c5ce7]"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.provider})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#7b7f9e] uppercase tracking-wider block mb-1">Max Tokens</label>
            <input
              type="number"
              defaultValue={settings?.defaults?.maxTokens || 4096}
              onBlur={(e) => setDefaults.mutate({ maxTokens: parseInt(e.target.value) || 4096 })}
              className="w-full bg-[#0a0c14] border border-[#2a2e45] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6c5ce7]"
            />
          </div>
        </div>
      </div>

      {/* Clear All */}
      <div className="pt-4 border-t border-[#2a2e45]">
        <button
          onClick={() => {
            if (confirm('Clear all settings? This will delete the settings file and remove all API keys.')) {
              clearAll.mutate();
              setTestResults({});
            }
          }}
          disabled={clearAll.isPending}
          className="px-5 py-2 text-xs rounded-lg border border-[#e17055] text-[#e17055] hover:bg-[rgba(225,112,85,.1)] transition-colors disabled:opacity-50"
        >
          {clearAll.isPending ? 'Clearing...' : 'Clear All Settings'}
        </button>
        <p className="text-[10px] text-[#555878] mt-2">
          This will delete the local settings JSON file and remove all configured API keys.
        </p>
      </div>
    </div>
  );
}
