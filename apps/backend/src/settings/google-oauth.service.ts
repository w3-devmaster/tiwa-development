import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';

const SCOPES = [
  'https://www.googleapis.com/auth/generative-language',
  'https://www.googleapis.com/auth/cloud-platform',
];

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(
    private settings: SettingsService,
    private config: ConfigService,
  ) {}

  private async getClientCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
    const gemini = await this.settings.getGeminiConfig();
    const clientId = gemini.googleClientId || this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = gemini.googleClientSecret || this.config.get('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) return null;
    return { clientId, clientSecret };
  }

  async getAuthUrl(redirectUri: string): Promise<string | null> {
    const creds = await this.getClientCredentials();
    if (!creds) return null;

    try {
      const { OAuth2Client } = await import('google-auth-library');
      const oauth2Client = new OAuth2Client(creds.clientId, creds.clientSecret, redirectUri);

      return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
      });
    } catch (err) {
      this.logger.error('Failed to generate Google auth URL', err);
      return null;
    }
  }

  async handleCallback(code: string, redirectUri: string): Promise<boolean> {
    const creds = await this.getClientCredentials();
    if (!creds) return false;

    try {
      const { OAuth2Client } = await import('google-auth-library');
      const oauth2Client = new OAuth2Client(creds.clientId, creds.clientSecret, redirectUri);

      const { tokens } = await oauth2Client.getToken(code);

      await this.settings.setGeminiOAuthTokens({
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token!,
        expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '',
        token_type: tokens.token_type || 'Bearer',
      });

      this.logger.log('Google OAuth tokens stored successfully');
      return true;
    } catch (err) {
      this.logger.error('Google OAuth callback failed', err);
      return false;
    }
  }

  async getAccessToken(): Promise<string | null> {
    const gemini = await this.settings.getGeminiConfig();
    if (gemini.authType !== 'oauth' || !gemini.oauthTokens) return null;

    const { oauthTokens } = gemini;

    // Check if token is expired
    if (oauthTokens.expiry && new Date(oauthTokens.expiry) < new Date()) {
      return this.refreshToken();
    }

    return oauthTokens.access_token;
  }

  private async refreshToken(): Promise<string | null> {
    const creds = await this.getClientCredentials();
    const gemini = await this.settings.getGeminiConfig();
    if (!creds || !gemini.oauthTokens?.refresh_token) return null;

    try {
      const { OAuth2Client } = await import('google-auth-library');
      const oauth2Client = new OAuth2Client(creds.clientId, creds.clientSecret);
      oauth2Client.setCredentials({ refresh_token: gemini.oauthTokens.refresh_token });

      const { credentials } = await oauth2Client.refreshAccessToken();

      await this.settings.setGeminiOAuthTokens({
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || gemini.oauthTokens.refresh_token,
        expiry: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : '',
        token_type: credentials.token_type || 'Bearer',
      });

      this.logger.log('Google OAuth token refreshed');
      return credentials.access_token!;
    } catch (err) {
      this.logger.error('Failed to refresh Google OAuth token', err);
      return null;
    }
  }

  async isConfigured(): Promise<boolean> {
    const creds = await this.getClientCredentials();
    return !!creds;
  }
}
