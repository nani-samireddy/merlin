import { GoogleGenAI } from "@google/genai";
import { BaseLLMProvider } from "./baseLLMProvider";

export class GeminiProvider extends BaseLLMProvider {
	private readonly ai: GoogleGenAI;
	private readonly modelName: string;

	constructor(apiKey: string, modelName: string = "gemini-2.5-flash") {
		super();
		this.ai = new GoogleGenAI({ apiKey });
		this.modelName = modelName;
	}

	protected async generateFromProvider(prompt: string): Promise<string> {
		const mermaidPrompt = this.buildMermaidPrompt(prompt);

		const response = await this.ai.models.generateContent({
			model: this.modelName,
			contents: mermaidPrompt,
			config: {
				thinkingConfig: {
					thinkingBudget: 0,
				},
			},
		});

		return response.text || "";
	}
}
