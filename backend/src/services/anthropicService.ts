/**
 * Minimal Anthropc service shim for local dev.
 * Provides the methods used by agentService: testAgent and streamMessage.
 * These implementations are lightweight mocks so the app can run without
 * requiring real API keys. Replace with real SDK usage for production.
 */

type StreamChunk = {
	type: string;
	delta: {
		type: string;
		text?: string;
	};
};

class AnthropicService {
	async testAgent(systemPrompt: string, message: string) {
		// Simple echo response for testing
		return {
			success: true,
			message: `Anthropic mock response to: ${message}`,
		};
	}

	async streamMessage(opts: {
		messages: Array<{ role: string; content: string }>;
		systemPrompt?: string;
		model?: string;
		temperature?: number;
		maxTokens?: number;
	}) {
		// Return an object with success and an async iterable "stream"
		const stream = (async function* () {
			const reply = 'This is a mock streaming response from Anthropic.';
			const words = reply.split(' ');
			for (const w of words) {
				// emulate streaming chunk format used in agentService
				yield { type: 'content_block_delta', delta: { type: 'text_delta', text: w + ' ' } } as StreamChunk;
			}
		})();

		return { success: true, stream };
	}
}

export const anthropicService = new AnthropicService();

