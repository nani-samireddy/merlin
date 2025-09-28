import { OllamaProvider } from "./ollama";
import { LLMProvider } from "./types";

export function getProvider(provider: string, options: any): LLMProvider {
	switch (provider) {
		case "ollama":
			return new OllamaProvider(options.model);
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}
