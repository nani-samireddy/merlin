import { LLMProvider } from "./types";

export abstract class BaseLLMProvider implements LLMProvider {
	protected static readonly MERMAID_PROMPT_TEMPLATE = `You are an expert Mermaid diagram generator. Generate ONLY valid Mermaid code with perfect syntax.

CRITICAL SYNTAX RULES:
1. Generate ONLY the Mermaid code - no explanations, no markdown blocks, no extra text
2. Start directly with diagram type: "flowchart TD" or "flowchart LR"
3. Use ONLY "-->" for arrows (never "- ->", "->", or other variations)
4. NO semicolons at end of lines
5. NO double brackets like "]]" - use single brackets "[text]"
6. Keep node labels simple - avoid special characters like :, ;, ), (

TEMPLATE EXAMPLE:
flowchart TD
    A[Start] --> B[Process]
    B --> C{Decision}
    C -->|Yes| D[Action]
    C -->|No| E[Other Action]
    D --> F[End]
    E --> F

Generate a Mermaid diagram for: {PROMPT}

Remember: Use simple text in nodes, always use "-->" for connections, no semicolons, no extra characters.`;

	protected static readonly FALLBACK_DIAGRAMS = {
		sequence: `sequenceDiagram
    participant A as User
    participant B as System
    A->>B: Request
    B-->>A: Response`,

		database: `erDiagram
    ENTITY1 ||--o{ ENTITY2 : relationship
    ENTITY1 {
        int id PK
        string name
    }
    ENTITY2 {
        int id PK
        int entity1_id FK
    }`,

		class: `classDiagram
    class Entity1 {
        +property1: string
        +method1(): void
    }
    Entity1 <|-- Entity2`,

		default: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
	} as const;

	protected static readonly VALID_MERMAID_STARTERS = [
		"graph",
		"flowchart",
		"sequenceDiagram",
		"classDiagram",
		"stateDiagram",
		"erDiagram",
		"gantt",
		"pie",
	] as const;

	protected buildMermaidPrompt(userPrompt: string): string {
		return BaseLLMProvider.MERMAID_PROMPT_TEMPLATE.replace(
			"{PROMPT}",
			userPrompt,
		);
	}

	protected validateAndCleanCode(code: string): string {
		return code
			.replace(/```mermaid\s*/g, "")
			.replace(/```\s*/g, "")
			.trim();
	}

	protected getFallbackDiagram(prompt: string): string {
		const lowerPrompt = prompt.toLowerCase();

		const diagramTypeMap = [
			{
				keywords: ["sequence", "api", "interaction"],
				type: "sequence" as const,
			},
			{
				keywords: ["database", "schema", "entity"],
				type: "database" as const,
			},
			{
				keywords: ["class", "object", "inheritance"],
				type: "class" as const,
			},
		];

		for (const { keywords, type } of diagramTypeMap) {
			if (keywords.some((keyword) => lowerPrompt.includes(keyword))) {
				return BaseLLMProvider.FALLBACK_DIAGRAMS[type];
			}
		}

		return BaseLLMProvider.FALLBACK_DIAGRAMS.default;
	}

	protected isValidMermaidStart(code: string): boolean {
		const firstLine = code.trim().split("\n")[0]?.toLowerCase() ?? "";
		return BaseLLMProvider.VALID_MERMAID_STARTERS.some((starter) =>
			firstLine.startsWith(starter),
		);
	}

	protected isValidMermaidCode(code: string): boolean {
		return code.length >= 10 && this.isValidMermaidStart(code);
	}

	public async generate(prompt: string): Promise<string> {
		if (!prompt?.trim()) {
			return this.getFallbackDiagram("general process");
		}

		try {
			const response = await this.generateFromProvider(prompt);
			const cleanedCode = this.validateAndCleanCode(response);

			if (!this.isValidMermaidCode(cleanedCode)) {
				console.warn("Generated code appears invalid, using fallback");
				return this.getFallbackDiagram(prompt);
			}

			return cleanedCode;
		} catch (error) {
			console.error("Error generating Mermaid diagram:", error);
			return this.getFallbackDiagram(prompt);
		}
	}

	protected abstract generateFromProvider(prompt: string): Promise<string>;
}
