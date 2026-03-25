export type AiProvider = 'anthropic' | 'openai' | 'gemini';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiToolParameter {
  type: string;
  description?: string;
  enum?: string[];
}

export interface AiTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, AiToolParameter>;
    required?: string[];
  };
}

export interface AiChatRequest {
  model: string;
  systemPrompt?: string;
  messages: AiMessage[];
  tools?: AiTool[];
  maxTokens?: number;
  temperature?: number;
}

export interface AiToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiChatResponse {
  content: string;
  toolCalls?: AiToolCall[];
  model: string;
  provider: AiProvider;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason: string;
}

export function detectProvider(model: string): AiProvider {
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4'))
    return 'openai';
  return 'anthropic';
}
