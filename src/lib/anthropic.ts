import Anthropic from "@anthropic-ai/sdk"

/**
 * Get an Anthropic client for a request.
 * Checks x-api-key header first (BYOK), falls back to server env var.
 */
export function getAnthropicClient(req: Request): Anthropic {
  const userKey = req.headers.get("x-api-key")
  if (userKey) {
    return new Anthropic({ apiKey: userKey })
  }
  // Falls back to ANTHROPIC_API_KEY env var (SDK default behavior)
  return new Anthropic()
}
