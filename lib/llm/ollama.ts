import { LLMProvider } from "./types";

export class OllamaProvider implements LLMProvider {
	model: string;

	constructor(model: string) {
		this.model = model;
	}

	private buildMermaidPrompt(userPrompt: string): string {
		return `You are an expert Mermaid diagram generator. Generate ONLY valid Mermaid code with perfect syntax.

CRITICAL SYNTAX RULES:
1. Generate ONLY the Mermaid code - no explanations, no markdown blocks, no extra text
2. Start directly with diagram type: "flowchart TD" or "flowchart LR"
3. Use ONLY "-->" for arrows (never "- ->", "->", or other variations)
4. NO semicolons at end of lines
5. NO double brackets like "]]" - use single brackets "[text]"
6. Keep node labels simple - avoid special characters like :, ;, ), (

CORRECT ARROW SYNTAX:
✓ A --> B
✓ A -->|label| B
✗ A - -> B (WRONG - has space)
✗ A -> B (WRONG - missing dash)
✗ A[text]; (WRONG - has semicolon)

CORRECT NODE FORMATS:
✓ A[Simple Text]
✓ B{Decision}
✓ C((Circle))
✗ A[Text: with colon] (WRONG)
✗ B]] (WRONG - double bracket)

TEMPLATE EXAMPLE:
flowchart TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action]
    C -->|No| E[Other Action]
    D --> F[End]
    E --> F

Generate a Mermaid diagram for: ${userPrompt}

Remember: Use simple text in nodes, always use "-->" for connections, no semicolons, no extra characters.`;
	}

	private validateAndCleanCode(code: string): string {
		// Remove any markdown wrappers
		return code
			.replace(/```mermaid\s*/g, "")
			.replace(/```\s*/g, "")
			.trim();
	}

	private getFallbackDiagram(prompt: string): string {
		// Determine appropriate fallback based on keywords
		const lowerPrompt = prompt.toLowerCase();

		if (
			lowerPrompt.includes("sequence") ||
			lowerPrompt.includes("api") ||
			lowerPrompt.includes("interaction")
		) {
			return `sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request
    B-->>A: Response`;
		}

		if (
			lowerPrompt.includes("database") ||
			lowerPrompt.includes("schema") ||
			lowerPrompt.includes("entity")
		) {
			return `erDiagram
    ENTITY1 ||--o{ ENTITY2 : relationship
    ENTITY1 {
        int id PK
        string name
    }
    ENTITY2 {
        int id PK
        int entity1_id FK
    }`;
		}

		if (
			lowerPrompt.includes("class") ||
			lowerPrompt.includes("object") ||
			lowerPrompt.includes("inheritance")
		) {
			return `classDiagram
    class Entity1 {
        +property1: string
        +method1(): void
    }
    Entity1 <|-- Entity2`;
		}

		// Default flowchart fallback
		return `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;
	}

	async generate(prompt: string): Promise<string> {
		if (!prompt || prompt.trim().length === 0) {
			return this.getFallbackDiagram("general process");
		}

		const mermaidPrompt = this.buildMermaidPrompt(prompt);

		try {
			const response = await fetch(
				"http://localhost:11434/api/generate",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: this.model,
						prompt: mermaidPrompt,
						stream: false,
						options: {
							temperature: 0.3, // Lower temperature for more consistent output
							top_p: 0.8,
							num_predict: 500, // Limit response length
						},
					}),
				},
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (!data.response) {
				throw new Error("No response from LLM");
			}

			const cleanedCode = this.validateAndCleanCode(data.response);

			// Validate the cleaned code has actual content
			if (
				cleanedCode.length < 10 ||
				!this.isValidMermaidStart(cleanedCode)
			) {
				console.warn("Generated code appears invalid, using fallback");
				return this.getFallbackDiagram(prompt);
			}

			return cleanedCode;
		} catch (error) {
			console.error("Error generating Mermaid diagram:", error);
			return this.getFallbackDiagram(prompt);
		}
	}

	private isValidMermaidStart(code: string): boolean {
		const validStarters = [
			"graph",
			"flowchart",
			"sequenceDiagram",
			"classDiagram",
			"stateDiagram",
			"erDiagram",
			"gantt",
			"pie",
		];

		const firstLine = code.trim().split("\n")[0].toLowerCase();
		return validStarters.some((starter) => firstLine.startsWith(starter));
	}
}
