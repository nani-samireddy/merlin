import { GeminiProvider } from "./gemini";
import { OllamaProvider } from "./ollama";
import { LLMProvider } from "./types";

export function getProvider(provider: string, options: any = {}): LLMProvider {
	switch (provider.toLowerCase()) {
		case "ollama":
			if (!options.model) {
				throw new Error("Ollama provider requires 'model' in options");
			}
			return new OllamaProvider(options.model, options.baseUrl);

		case "gemini": {
			const apiKey = process.env.GEMINI_API_KEY;
			if (!apiKey) {
				throw new Error(
					"GEMINI_API_KEY not found in environment variables. " +
						"Set GEMINI_API_KEY in your .env file.",
				);
			}
			// Set default model if options doesn't have one
			const model = options.model ?? "gemini-2.5-flash";
			return new GeminiProvider(apiKey, model);
		}

		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}
