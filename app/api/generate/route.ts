import { getProviderFromEnv } from "@/lib/llm";

export async function POST(req: Request) {
	try {
		const { prompt } = await req.json();
		const llm = getProviderFromEnv();
		const code = await llm.generate(prompt);
		return new Response(JSON.stringify({ code }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("/api/generate error", error);
		const message = error instanceof Error ? error.message : "Unknown error";
		return new Response(JSON.stringify({ error: message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
