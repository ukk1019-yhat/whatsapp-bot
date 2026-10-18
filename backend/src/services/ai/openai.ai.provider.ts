import { env } from '../../config/env.js';
import { logger } from '../../logger/logger.js';
import { AIResponseResult, GroundedContext, IAIProvider } from '../../types/index.js';
import { buildSystemPrompt, sanitizeUserInput } from './prompt.builder.js';

export class OpenAIAIProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || env.AI_PROVIDER_API_KEY || '';
    this.model = model || env.AI_MODEL;
  }

  async generateReply(
    userMessage: string,
    history: Array<{ sender: 'customer' | 'ai' | 'human_agent'; text: string }>,
    groundedContext: GroundedContext
  ): Promise<AIResponseResult> {
    const sanitizedInput = sanitizeUserInput(userMessage);
    const systemInstruction = buildSystemPrompt(groundedContext);

    const messages = [
      { role: 'system', content: systemInstruction },
      ...history.slice(-8).map((h) => ({
        role: h.sender === 'customer' ? 'user' : 'assistant',
        content: h.text,
      })),
      {
        role: 'user',
        content: `${sanitizedInput}

Respond strictly in JSON format matching this schema:
{
  "replyText": "your concise WhatsApp reply grounded ONLY on the approved facts",
  "confidence": 0.95,
  "shouldEscalate": false,
  "escalationReason": "reason if confidence < 0.75, unverified pricing asked, or refund/dispute requested",
  "detectedLeadInfo": {
    "customerName": "detected name if provided",
    "organization": "detected school or company name if provided",
    "enquiryCategory": "category of enquiry",
    "requirements": "brief summary of user project or course interest",
    "budgetRange": "budget if specified",
    "expectedTimeline": "timeline if specified"
  }
}`,
      },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          messages,
          temperature: 0.2, // Low temperature for high precision grounding
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, errorText }, 'OpenAI API request failed');
        throw new Error(`OpenAI API error: HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      return {
        replyText: parsed.replyText || groundedContext.settings.fallback_message,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        shouldEscalate: Boolean(parsed.shouldEscalate),
        escalationReason: parsed.escalationReason,
        detectedLeadInfo: parsed.detectedLeadInfo,
      };
    } catch (err) {
      logger.error({ err }, 'Error in OpenAI API generation, falling back to safe response');
      return {
        replyText: groundedContext.settings.fallback_message,
        confidence: 0.5,
        shouldEscalate: true,
        escalationReason: 'ai_service_unavailable_fallback',
      };
    }
  }
}
