import { Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMMessage, LLMOptions } from './llm-provider.interface';

export class GeminiProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is required when LLM_PROVIDER=gemini');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = process.env.LLM_MODEL || 'gemini-2.0-flash';
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    this.logger.log(`Sending chat request to Gemini (${this.model})`);

    try {
      // Extract system message for systemInstruction
      const systemMessage = messages.find((m) => m.role === 'system');
      const conversationMessages = messages.filter((m) => m.role !== 'system');

      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
        systemInstruction: systemMessage?.content || undefined,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 512,
          topP: options?.topP ?? 0.9,
        },
      });

      // Map messages to Gemini format (assistant → model)
      const history = conversationMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const lastMessage = conversationMessages[conversationMessages.length - 1];

      const chat = generativeModel.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const content = result.response.text();

      this.logger.log(`Gemini response received`);
      return content;
    } catch (error) {
      this.logger.error(`Failed to communicate with Gemini: ${error.message}`);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const generativeModel = this.client.getGenerativeModel({
        model: this.model,
      });
      await generativeModel.countTokens('health check');
      return true;
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return 'gemini';
  }
}
