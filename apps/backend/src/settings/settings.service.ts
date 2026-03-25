import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ProviderConfig {
  apiKey?: string;
  enabled: boolean;
  authType?: 'api_key' | 'service_account' | 'oauth';
  serviceAccount?: Record<string, unknown>;
  oauthTokens?: {
    access_token: string;
    refresh_token: string;
    expiry: string;
    token_type?: string;
  };
  googleClientId?: string;
  googleClientSecret?: string;
}

export interface AppSettings {
  providers: {
    anthropic: ProviderConfig;
    openai: ProviderConfig;
    gemini: ProviderConfig;
  };
  defaults: {
    model: string;
    maxTokens: number;
  };
}

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  providers: {
    anthropic: { enabled: false },
    openai: { enabled: false },
    gemini: { enabled: false, authType: 'api_key' },
  },
  defaults: {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
  },
};

function maskKey(key?: string): string | undefined {
  if (!key) return undefined;
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private cache: AppSettings | null = null;

  async getAll(): Promise<AppSettings> {
    if (this.cache) return this.cache;
    try {
      const raw = await fs.readFile(SETTINGS_PATH, 'utf-8');
      this.cache = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      return this.cache!;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  async getMasked(): Promise<any> {
    const settings = await this.getAll();
    return {
      providers: {
        anthropic: {
          ...settings.providers.anthropic,
          apiKey: maskKey(settings.providers.anthropic.apiKey),
        },
        openai: {
          ...settings.providers.openai,
          apiKey: maskKey(settings.providers.openai.apiKey),
        },
        gemini: {
          ...settings.providers.gemini,
          apiKey: maskKey(settings.providers.gemini.apiKey),
          serviceAccount: settings.providers.gemini.serviceAccount
            ? { project_id: (settings.providers.gemini.serviceAccount as any).project_id, _masked: true }
            : undefined,
          oauthTokens: settings.providers.gemini.oauthTokens
            ? { _connected: true, expiry: settings.providers.gemini.oauthTokens.expiry }
            : undefined,
          googleClientId: maskKey(settings.providers.gemini.googleClientId),
          googleClientSecret: maskKey(settings.providers.gemini.googleClientSecret),
        },
      },
      defaults: settings.defaults,
    };
  }

  async save(settings: AppSettings): Promise<void> {
    await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    this.cache = settings;
    this.logger.log('Settings saved');
  }

  async setProviderKey(provider: 'anthropic' | 'openai' | 'gemini', apiKey: string): Promise<void> {
    const settings = await this.getAll();
    settings.providers[provider].apiKey = apiKey;
    settings.providers[provider].enabled = true;
    if (provider === 'gemini') {
      settings.providers.gemini.authType = 'api_key';
    }
    await this.save(settings);
  }

  async setGeminiServiceAccount(json: Record<string, unknown>): Promise<void> {
    const settings = await this.getAll();
    settings.providers.gemini.serviceAccount = json;
    settings.providers.gemini.authType = 'service_account';
    settings.providers.gemini.enabled = true;
    await this.save(settings);
  }

  async setGeminiOAuthTokens(tokens: ProviderConfig['oauthTokens']): Promise<void> {
    const settings = await this.getAll();
    settings.providers.gemini.oauthTokens = tokens;
    settings.providers.gemini.authType = 'oauth';
    settings.providers.gemini.enabled = true;
    await this.save(settings);
  }

  async setGeminiOAuthCredentials(clientId: string, clientSecret: string): Promise<void> {
    const settings = await this.getAll();
    settings.providers.gemini.googleClientId = clientId;
    settings.providers.gemini.googleClientSecret = clientSecret;
    await this.save(settings);
  }

  async setDefaults(defaults: Partial<AppSettings['defaults']>): Promise<void> {
    const settings = await this.getAll();
    if (defaults.model !== undefined) settings.defaults.model = defaults.model;
    if (defaults.maxTokens !== undefined) settings.defaults.maxTokens = defaults.maxTokens;
    await this.save(settings);
  }

  async removeProvider(provider: 'anthropic' | 'openai' | 'gemini'): Promise<void> {
    const settings = await this.getAll();
    settings.providers[provider] = provider === 'gemini'
      ? { enabled: false, authType: 'api_key' }
      : { enabled: false };
    await this.save(settings);
  }

  async clearAll(): Promise<void> {
    try {
      await fs.unlink(SETTINGS_PATH);
    } catch {
      // file may not exist
    }
    this.cache = null;
    this.logger.log('All settings cleared');
  }

  async getProviderApiKey(provider: 'anthropic' | 'openai' | 'gemini'): Promise<string | undefined> {
    const settings = await this.getAll();
    return settings.providers[provider].apiKey;
  }

  async getGeminiConfig(): Promise<ProviderConfig> {
    const settings = await this.getAll();
    return settings.providers.gemini;
  }

  invalidateCache(): void {
    this.cache = null;
  }
}
