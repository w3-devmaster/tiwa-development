import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';
import {
  AiChatRequest,
  AiChatResponse,
  AiProvider,
  detectProvider,
} from './ai-provider.interfaces';

@Injectable()
export class AiProviderService implements OnModuleInit {
  private readonly logger = new Logger(AiProviderService.name);
  private anthropicClient: any;
  private openaiClient: any;
  private geminiClient: any;

  constructor(
    private config: ConfigService,
    private settings: SettingsService,
  ) {}

  async onModuleInit() {
    await this.reinitialize();
  }

  async reinitialize() {
    this.anthropicClient = null;
    this.openaiClient = null;
    this.geminiClient = null;

    // Read from settings JSON first, fallback to env vars
    const settingsData = await this.settings.getAll();

    const anthropicKey =
      settingsData.providers.anthropic.apiKey ||
      this.config.get<string>('ANTHROPIC_API_KEY');

    const openaiKey =
      settingsData.providers.openai.apiKey ||
      this.config.get<string>('OPENAI_API_KEY');

    const geminiConfig = settingsData.providers.gemini;
    const geminiApiKey =
      geminiConfig.apiKey || this.config.get<string>('GEMINI_API_KEY');

    // Anthropic
    if (anthropicKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
        this.logger.log('Anthropic provider initialized');
      } catch {
        this.logger.warn('Failed to initialize Anthropic provider');
      }
    }

    // OpenAI
    if (openaiKey) {
      try {
        const { default: OpenAI } = await import('openai');
        this.openaiClient = new OpenAI({ apiKey: openaiKey });
        this.logger.log('OpenAI provider initialized');
      } catch {
        this.logger.warn('Failed to initialize OpenAI provider');
      }
    }

    // Gemini
    if (geminiApiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        this.geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
        this.logger.log('Gemini provider initialized (API key)');
      } catch {
        this.logger.warn('Failed to initialize Gemini provider');
      }
    } else if (geminiConfig.authType === 'service_account' && geminiConfig.serviceAccount) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        // Service account auth via application default credentials
        const sa = geminiConfig.serviceAccount as any;
        this.geminiClient = new GoogleGenAI({
          vertexai: false,
          apiKey: sa.api_key || undefined,
        });
        this.logger.log('Gemini provider initialized (service account)');
      } catch {
        this.logger.warn('Failed to initialize Gemini with service account');
      }
    } else if (geminiConfig.authType === 'oauth' && geminiConfig.oauthTokens) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        // OAuth token-based auth
        this.geminiClient = new GoogleGenAI({
          apiKey: '', // placeholder; will use httpOptions with bearer token
        });
        this.logger.log('Gemini provider initialized (OAuth)');
      } catch {
        this.logger.warn('Failed to initialize Gemini with OAuth');
      }
    }

    const providers = this.getAvailableProviders();
    if (providers.length === 0) {
      this.logger.warn('No AI provider configured.');
    } else {
      this.logger.log(`Active providers: ${providers.join(', ')}`);
    }
  }

  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    const provider = detectProvider(request.model);

    switch (provider) {
      case 'anthropic':
        return this.chatAnthropic(request);
      case 'openai':
        return this.chatOpenAI(request);
      case 'gemini':
        return this.chatGemini(request);
      default:
        return this.chatAnthropic(request);
    }
  }

  // ─── Anthropic ───────────────────────────────────────────────────

  private async chatAnthropic(request: AiChatRequest): Promise<AiChatResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic provider not configured. Add API key in Settings.');
    }

    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const params: any = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      messages,
    };

    if (request.systemPrompt) params.system = request.systemPrompt;
    if (request.temperature !== undefined) params.temperature = request.temperature;

    if (request.tools?.length) {
      params.tools = request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const response = await this.anthropicClient.messages.create(params);

    let content = '';
    const toolCalls: AiChatResponse['toolCalls'] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: block.input as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: request.model,
      provider: 'anthropic',
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
      },
      finishReason: response.stop_reason ?? 'end_turn',
    };
  }

  // ─── OpenAI ──────────────────────────────────────────────────────

  private async chatOpenAI(request: AiChatRequest): Promise<AiChatResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI provider not configured. Add API key in Settings.');
    }

    const messages: any[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    for (const m of request.messages) {
      messages.push({ role: m.role, content: m.content });
    }

    const params: any = {
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      messages,
    };

    if (request.temperature !== undefined) params.temperature = request.temperature;

    if (request.tools?.length) {
      params.tools = request.tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const response = await this.openaiClient.chat.completions.create(params);
    const choice = response.choices?.[0];
    const content = choice?.message?.content || '';
    const toolCalls: AiChatResponse['toolCalls'] = [];

    if (choice?.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}'),
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: request.model,
      provider: 'openai',
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
      finishReason: choice?.finish_reason ?? 'stop',
    };
  }

  // ─── Gemini ──────────────────────────────────────────────────────

  private async chatGemini(request: AiChatRequest): Promise<AiChatResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini provider not configured. Add API key in Settings.');
    }

    // Build contents array for Gemini
    const contents: any[] = [];
    for (const m of request.messages) {
      if (m.role === 'system') continue; // handled separately
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      });
    }

    const config: any = {
      maxOutputTokens: request.maxTokens || 4096,
    };

    if (request.systemPrompt) {
      config.systemInstruction = request.systemPrompt;
    }

    if (request.temperature !== undefined) {
      config.temperature = request.temperature;
    }

    if (request.tools?.length) {
      config.tools = [{
        functionDeclarations: request.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
      }];
    }

    const response = await this.geminiClient.models.generateContent({
      model: request.model,
      contents,
      config,
    });

    const content = response.text || '';
    const toolCalls: AiChatResponse['toolCalls'] = [];

    // Handle function calls from Gemini
    if (response.functionCalls && response.functionCalls.length > 0) {
      for (const fc of response.functionCalls) {
        toolCalls.push({
          id: fc.id || `gemini-${Date.now()}`,
          name: fc.name,
          arguments: (fc.args || {}) as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      model: request.model,
      provider: 'gemini',
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      },
      finishReason: response.candidates?.[0]?.finishReason ?? 'stop',
    };
  }

  // ─── Utilities ───────────────────────────────────────────────────

  getAvailableProviders(): AiProvider[] {
    const providers: AiProvider[] = [];
    if (this.anthropicClient) providers.push('anthropic');
    if (this.openaiClient) providers.push('openai');
    if (this.geminiClient) providers.push('gemini');
    return providers;
  }
}
