"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [mermaidCodes, setMermaidCodes] = useState<string[]>([`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
    `]);
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState("");

	// Initialize mermaid
	useEffect(() => {
		const initializeMermaid = async () => {
			// Dynamically import mermaid to avoid SSR issues
			const mermaid = (await import("mermaid")).default;

			mermaid.initialize({
				startOnLoad: false, // Important: set to false for manual rendering
				theme: "dark",
				securityLevel: "loose",
			});
		};

		initializeMermaid();
	}, []);

	// Render mermaid diagrams
	useEffect(() => {
		const renderDiagrams = async () => {
			if (containerRef.current) {
				try {
					const mermaid = (await import("mermaid")).default;
                    
					// Clear previous content
					containerRef.current.innerHTML = "";
                    
					// Create a container for each diagram
					const diagramsContainer = document.createElement('div');
					diagramsContainer.className = 'space-y-8';
                    
					// Process each diagram
					for (const [index, code] of mermaidCodes.entries()) {
						if (!code.trim()) continue;
                        
						const diagramContainer = document.createElement('div');
						diagramContainer.className = 'bg-gray-800 p-4 rounded-lg';
                        
						try {
							const id = `mermaid-${Date.now()}-${index}`;
							const { svg } = await mermaid.render(id, code);
							diagramContainer.innerHTML = svg;
						} catch (error) {
							console.error(`Error rendering diagram ${index + 1}:`, error);
							diagramContainer.innerHTML = `
								<div class="text-red-500 p-4 border border-red-300 rounded">
									Error rendering diagram ${index + 1}
								</div>
							`;
						}
                        
						diagramsContainer.appendChild(diagramContainer);
					}
                    
					containerRef.current.appendChild(diagramsContainer);
				} catch (error) {
					console.error("Error initializing diagrams:", error);
					if (containerRef.current) {
						containerRef.current.innerHTML =
							'<div class="text-red-500 p-4 border border-red-300 rounded">Error initializing diagram renderer</div>';
					}
				}
			}
		};

		renderDiagrams();
	}, [mermaidCodes]);

	const generate = async () => {
		if (!prompt.trim()) {
			setError("Please enter a description for your diagram");
			return;
		}

		setIsGenerating(true);
		setError("");

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt,
					provider: "gemini",
					// options: { model: "gemma3:4b" },
				}),
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const data = await res.json();

			if (data.code) {
				// Split the response by ```mermaid blocks or multiple newlines to handle multiple diagrams
				const diagramBlocks = data.code
					.split(/(?:```(?:mermaid)?\s*\n?|\n\s*\n\s*)/)
					.map((block: string) => block.trim())
					.filter(Boolean);
				setMermaidCodes(diagramBlocks);
			} else {
				throw new Error("No diagram code received");
			}
		} catch (error) {
			console.error("Generation error:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Unknown error occurred";
			setError(`Failed to generate diagram: ${errorMessage}`);
			setIsGenerating(false);
		}
	};

	const handleExampleDiagram = () => {
		setMermaidCodes([
			`flowchart TD
      A[User Input] --> B{Valid?}
      B -->|Yes| C[Process Data]
      B -->|No| D[Show Error]
      C --> E[Save to Database]
      D --> A
      E --> F[Display Success]`,
			`sequenceDiagram
      participant User
      participant System
      User->>System: Submit Form
      System->>System: Validate Input
      alt Valid Input
          System->>System: Process Data
          System->>System: Save to DB
          System-->>User: Show Success
      else Invalid Input
          System-->>User: Show Error
      end`
		]);
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-6xl mx-auto space-y-6">
				<h1 className="text-3xl font-bold text-center text-blue-400">Merlin</h1>
				<p className="text-center text-gray-400">AI-Powered Mermaid Diagram Generator</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<div className="flex space-x-2">
							<input
								type="text"
								className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Describe your diagram..."
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && generate()}
								disabled={isGenerating}
							/>
							<button
								onClick={generate}
								disabled={isGenerating}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isGenerating ? 'Generating...' : 'Generate'}
							</button>
						</div>

						{error && (
							<div className="text-red-500 p-3 bg-red-900/50 rounded-lg">
								{error}
							</div>
						)}

						<button
							onClick={handleExampleDiagram}
							className="text-sm text-blue-400 hover:text-blue-300 mb-4 block"
						>
							Try an example
						</button>

						<label className="block text-sm font-medium mb-2">
							Or edit Mermaid code directly (separate multiple diagrams with '---'):
						</label>
						<textarea
							className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							value={mermaidCodes.map(code => code.trim()).join('\n\n---\n\n')}
							onChange={(e) => {
								const diagrams = e.target.value
									.split(/\n\s*---\s*\n/)
									.map(diagram => diagram.trim())
									.filter(Boolean);
								setMermaidCodes(diagrams);
							}}
							placeholder="graph TD\n    A[Start] --> B[End]\n\n---\n\ngraph TD\n    C[Another] --> D[Diagram]"
						/>
					</div>

					<div className="space-y-4">
						<h3 className="text-lg font-semibold">
							Generated Diagram{mermaidCodes.length > 1 ? 's' : ''}:
						</h3>
						<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 min-h-96">
							<div
								ref={containerRef}
								className="mermaid-container w-full h-full flex items-center justify-center"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
