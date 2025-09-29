import { BaseLLMProvider } from "./baseLLMProvider";

export class OllamaProvider extends BaseLLMProvider {
	private readonly model: string;
	private readonly baseUrl: string;

	constructor(model: string, baseUrl: string = "http://localhost:11434") {
		super();
		this.model = model;
		this.baseUrl = baseUrl;
	}

	protected async generateFromProvider(prompt: string): Promise<string> {
		const mermaidPrompt = this.buildMermaidPrompt(prompt);

		const response = await fetch(`${this.baseUrl}/api/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: this.model,
				prompt: mermaidPrompt,
				stream: false,
				options: {
					temperature: 0.3,
					top_p: 0.8,
					num_predict: 500,
				},
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (!data.response) {
			throw new Error("No response from LLM");
		}

		return data.response;
	}
}
