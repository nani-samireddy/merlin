import { GeminiProvider } from "./gemini";
import { OllamaProvider } from "./ollama";
import { LLMProvider } from "./types";

export function getProvider(provider: string, options: any = {}): LLMProvider {
  switch (provider.toLowerCase()) {
    case "ollama":
      if (!options.model) {
        throw new Error("Ollama provider requires 'model' in options")
      }
      return new OllamaProvider(options.model, options.baseUrl)

    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error(
          "GEMINI_API_KEY not found in environment variables. Set GEMINI_API_KEY in your .env file."
        )
      }
      const model = options.model ?? "gemini-2.5-flash"
      return new GeminiProvider(apiKey, model)
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

export function getProviderFromEnv(): LLMProvider {
  const explicit = process.env.MERLIN_PROVIDER?.toLowerCase()
  if (explicit === "ollama") {
    const model = process.env.OLLAMA_MODEL
    if (!model) throw new Error("MERLIN_PROVIDER=ollama requires OLLAMA_MODEL")
    const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434"
    return new OllamaProvider(model, baseUrl)
  }
  if (explicit === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("MERLIN_PROVIDER=gemini requires GEMINI_API_KEY")
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash"
    return new GeminiProvider(apiKey, model)
  }

  // Autodetect preference: Ollama if configured, else Gemini
  if (process.env.OLLAMA_MODEL) {
    const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434"
    return new OllamaProvider(process.env.OLLAMA_MODEL, baseUrl)
  }
  if (process.env.GEMINI_API_KEY) {
    return new GeminiProvider(
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_MODEL || "gemini-2.5-flash"
    )
  }

  throw new Error(
    "No LLM provider configured. Set MERLIN_PROVIDER or OLLAMA_MODEL/GEMINI_API_KEY in .env"
  )
}
