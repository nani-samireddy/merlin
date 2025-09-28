import { getProvider } from "@/lib/llm";

export async function POST(req: Request) {
	const {
		prompt,
		provider = "ollama",
		options = { model: "gemma3:4b" },
	} = await req.json();
	const llm = getProvider(provider, options);

	const code = await llm.generate(prompt);
	return new Response(JSON.stringify({ code }), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
		},
	});
}
