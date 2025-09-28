"use client";
import { useEffect, useRef, useState } from "react";

export default function Home() {
	const containerRef = useRef(null);
	const [mermaidCode, setMermaidCode] = useState(`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`);
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

	// Render mermaid diagram
	useEffect(() => {
		const renderDiagram = async () => {
			if (containerRef.current && mermaidCode.trim()) {
				try {
					const mermaid = (await import("mermaid")).default;

					// Clear previous content
					containerRef.current.innerHTML = "";
					// Generate unique ID
					const id = `mermaid-${Date.now()}`;

					// Render the diagram
					const { svg } = await mermaid.render(id, mermaidCode);
					containerRef.current.innerHTML = svg;
				} catch (error) {
					console.error("Mermaid rendering error:", error);
					containerRef.current.innerHTML = `<div class="text-red-500 p-4 border border-red-300 rounded">
            Error rendering diagram: ${error.message}
          </div>`;
				}
			}
		};

		renderDiagram();
	}, [mermaidCode]);

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
					provider: "ollama",
					options: { model: "gemma3:4b" },
				}),
			});

			if (!res.ok) {
				throw new Error(`HTTP error! status: ${res.status}`);
			}

			const data = await res.json();

			if (data.code) {
				setMermaidCode(data.code);
			} else {
				throw new Error("No diagram code received");
			}
		} catch (error) {
			console.error("Generation error:", error);
			setError(`Failed to generate diagram: ${error.message}`);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleExampleDiagram = () => {
		setMermaidCode(`flowchart TD
      A[User Input] --> B{Valid?}
      B -->|Yes| C[Process Data]
      B -->|No| D[Show Error]
      C --> E[Generate Result]
      D --> F[Ask for Correction]
      E --> G[Display Output]
      F --> A`);
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white p-6">
			<div className="max-w-6xl mx-auto space-y-6">
				<h1 className="text-3xl font-bold text-center mb-8">
					Mermaid Diagram Generator
				</h1>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Input Panel */}
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-2">
								Describe your diagram:
							</label>
							<textarea
								className="w-full h-32 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="e.g., Create a flowchart showing the user login process..."
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
							/>
						</div>

						<div className="flex gap-3">
							<button
								onClick={generate}
								disabled={isGenerating}
								className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
							>
								{isGenerating
									? "Generating..."
									: "Generate Diagram"}
							</button>

							<button
								onClick={handleExampleDiagram}
								className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
							>
								Example
							</button>
						</div>

						{error && (
							<div className="p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-200">
								{error}
							</div>
						)}

						{/* Manual Input */}
						<div>
							<label className="block text-sm font-medium mb-2">
								Or edit Mermaid code directly:
							</label>
							<textarea
								className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								value={mermaidCode}
								onChange={(e) => setMermaidCode(e.target.value)}
								placeholder="graph TD&#10;    A[Start] --> B[End]"
							/>
						</div>
					</div>

					{/* Diagram Panel */}
					<div className="space-y-4">
						<h3 className="text-lg font-semibold">
							Generated Diagram:
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
