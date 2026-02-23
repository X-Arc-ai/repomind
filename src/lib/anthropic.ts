import Anthropic from "@anthropic-ai/sdk"

/**
 * Get an Anthropic client for a request.
 * Requires a user-provided API key via the x-api-key header.
 */
export function getAnthropicClient(req: Request): Anthropic {
  const userKey = req.headers.get("x-api-key")
  if (!userKey) {
    throw new Error("API key required. Please add your Anthropic API key in Settings.")
  }
  return new Anthropic({ apiKey: userKey })
}
