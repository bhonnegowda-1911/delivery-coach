// Provider-agnostic chat wrapper. The grading analyzer talks to this, not to a vendor —
// swapping providers is a branch here, no UI/analyzer changes. Claude is implemented;
// the OpenAI adapter slot is left documented and unimplemented (Phase: add when needed).

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export type Provider = 'anthropic' | 'openai'

export type LlmErrorCode =
  | 'no_key'
  | 'network'
  | 'auth'
  | 'rate'
  | 'http'
  | 'refusal'
  | 'empty'
  | 'parse'
  | 'not_implemented'
  | 'bad_provider'

export class LlmError extends Error {
  code?: LlmErrorCode
  constructor(message: string, { code }: { code?: LlmErrorCode } = {}) {
    super(message)
    this.name = 'LlmError'
    this.code = code
  }
}

/** JSON Schema passed to the model to constrain the response shape. */
export type JsonSchema = Record<string, unknown>

export interface ChatStructuredRequest {
  provider: Provider
  model: string
  apiKey: string
  system: string
  user: string
  schema: JsonSchema
  maxTokens?: number
  /**
   * Sampling temperature. Only sent to the API when a number is provided — omit it for
   * Opus 4.7+/Fable models, which reject the parameter. Pass 0 for deterministic grading.
   */
  temperature?: number
  /** Adaptive thinking (Opus 4.6+/Sonnet 4.6). Lets the model reason before answering. */
  thinking?: 'adaptive'
  /** Thinking depth / overall token spend. Defaults to the model's `high` when omitted. */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  signal?: AbortSignal
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>
  stop_reason?: string
}

/** Run a single structured-output chat completion. `T` is the expected parsed shape. */
export async function chatStructured<T = unknown>(
  req: ChatStructuredRequest,
): Promise<{ parsed: T; raw: AnthropicResponse }> {
  switch (req.provider) {
    case 'anthropic':
      return chatAnthropic<T>(req)
    case 'openai':
      // Adapter slot — see llmClient OpenAI notes. Not implemented in this POC.
      throw new LlmError('OpenAI provider is not implemented yet.', { code: 'not_implemented' })
    default:
      throw new LlmError(`Unknown provider: ${req.provider}`, { code: 'bad_provider' })
  }
}

async function chatAnthropic<T>({
  model,
  apiKey,
  system,
  user,
  schema,
  maxTokens = 1500,
  temperature,
  thinking,
  effort,
  signal,
}: ChatStructuredRequest): Promise<{ parsed: T; raw: AnthropicResponse }> {
  if (!apiKey) throw new LlmError('Missing Anthropic API key.', { code: 'no_key' })

  const outputConfig: Record<string, unknown> = { format: { type: 'json_schema', schema } }
  if (effort) outputConfig.effort = effort

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
    output_config: outputConfig,
  }
  // Only send temperature when explicitly given — Opus 4.7+/Fable reject it.
  if (typeof temperature === 'number') body.temperature = temperature
  if (thinking) body.thinking = { type: thinking }

  let res: Response
  try {
    res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e
    throw new LlmError('Network error reaching Anthropic.', { code: 'network' })
  }

  if (!res.ok) {
    if (res.status === 401) throw new LlmError('Invalid Anthropic API key.', { code: 'auth' })
    if (res.status === 429) throw new LlmError('Anthropic rate limit hit. Wait and retry.', { code: 'rate' })
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message ? `: ${err.error.message}` : ''
    } catch {
      // ignore parse failure
    }
    throw new LlmError(`Analysis failed (${res.status})${detail}.`, { code: 'http' })
  }

  const data = (await res.json()) as AnthropicResponse
  if (data.stop_reason === 'refusal') {
    throw new LlmError('The model declined to analyze this content.', { code: 'refusal' })
  }

  const textBlock = (data.content || []).find((b) => b.type === 'text')
  if (!textBlock?.text) {
    throw new LlmError('Empty analysis response.', { code: 'empty' })
  }

  let parsed: T
  try {
    parsed = JSON.parse(textBlock.text) as T
  } catch {
    throw new LlmError('Could not parse the analysis response.', { code: 'parse' })
  }

  return { parsed, raw: data }
}
