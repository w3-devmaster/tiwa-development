import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { GoogleOAuthService } from './google-oauth.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';

@Controller('api/settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(
    private settings: SettingsService,
    private googleOAuth: GoogleOAuthService,
    private aiProvider: AiProviderService,
  ) {}

  @Get()
  async getSettings() {
    return this.settings.getMasked();
  }

  @Put('providers/:provider/key')
  async setProviderKey(
    @Param('provider') provider: string,
    @Body() body: { apiKey: string },
  ) {
    if (!['anthropic', 'openai', 'gemini'].includes(provider)) {
      throw new BadRequestException('Invalid provider');
    }
    if (!body.apiKey?.trim()) {
      throw new BadRequestException('API key is required');
    }

    await this.settings.setProviderKey(provider as any, body.apiKey.trim());
    await this.aiProvider.reinitialize();
    return { success: true, provider };
  }

  @Put('providers/gemini/service-account')
  async setGeminiServiceAccount(@Body() body: { serviceAccount: Record<string, unknown> }) {
    if (!body.serviceAccount || typeof body.serviceAccount !== 'object') {
      throw new BadRequestException('Service account JSON is required');
    }
    await this.settings.setGeminiServiceAccount(body.serviceAccount);
    await this.aiProvider.reinitialize();
    return { success: true, provider: 'gemini', authType: 'service_account' };
  }

  @Put('providers/gemini/oauth-credentials')
  async setGeminiOAuthCredentials(@Body() body: { clientId: string; clientSecret: string }) {
    if (!body.clientId?.trim() || !body.clientSecret?.trim()) {
      throw new BadRequestException('Client ID and Client Secret are required');
    }
    await this.settings.setGeminiOAuthCredentials(body.clientId.trim(), body.clientSecret.trim());
    return { success: true };
  }

  @Put('defaults')
  async setDefaults(@Body() body: { model?: string; maxTokens?: number }) {
    await this.settings.setDefaults(body);
    return { success: true };
  }

  @Delete('providers/:provider')
  @HttpCode(200)
  async removeProvider(@Param('provider') provider: string) {
    if (!['anthropic', 'openai', 'gemini'].includes(provider)) {
      throw new BadRequestException('Invalid provider');
    }
    await this.settings.removeProvider(provider as any);
    await this.aiProvider.reinitialize();
    return { success: true, provider };
  }

  @Delete()
  @HttpCode(200)
  async clearAll() {
    await this.settings.clearAll();
    await this.aiProvider.reinitialize();
    return { success: true };
  }

  @Get('providers/:provider/status')
  async testProvider(@Param('provider') provider: string) {
    if (!['anthropic', 'openai', 'gemini'].includes(provider)) {
      throw new BadRequestException('Invalid provider');
    }

    try {
      const available = this.aiProvider.getAvailableProviders();
      const isAvailable = available.includes(provider as any);
      return { provider, connected: isAvailable };
    } catch {
      return { provider, connected: false };
    }
  }

  @Get('google/auth-url')
  async getGoogleAuthUrl(@Query('redirectUri') redirectUri: string) {
    if (!redirectUri) {
      throw new BadRequestException('redirectUri query parameter is required');
    }
    const isConfigured = await this.googleOAuth.isConfigured();
    if (!isConfigured) {
      throw new BadRequestException(
        'Google OAuth not configured. Set client ID and secret first.',
      );
    }
    const url = await this.googleOAuth.getAuthUrl(redirectUri);
    if (!url) {
      throw new BadRequestException('Failed to generate auth URL');
    }
    return { url };
  }

  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('redirectUri') redirectUri: string,
  ) {
    if (!code) {
      throw new BadRequestException('Authorization code is required');
    }
    const success = await this.googleOAuth.handleCallback(code, redirectUri || '');
    if (success) {
      await this.aiProvider.reinitialize();
    }
    return { success };
  }
}
