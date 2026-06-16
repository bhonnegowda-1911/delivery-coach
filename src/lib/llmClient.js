// Provider-agnostic chat wrapper. The grading analyzer talks to this, not to a vendor —
// swapping providers is a branch here, no UI/analyzer changes. Claude is implemented;
// the OpenAI adapter slot is left documented and unimplemented (Phase: add when needed).

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export class LlmError extends Error {
  constructor(message, { code } = {}) {
    super(message)
    this.name = 'LlmError'
    this.code = code
  }
}

/**
 * Run a single structured-output chat completion.
 * @param {object} req
 * @param {'anthropic'|'openai'} req.provider
 * @param {string} req.model
 * @param {string} req.apiKey
 * @param {string} req.system
 * @param {string} req.user
 * @param {object} req.schema           JSON Schema for the constrained response.
 * @param {number} [req.maxTokens]
 * @param {AbortSignal} [req.signal]
 * @returns {Promise<{ parsed: object, raw: object }>}
 */
export async function chatStructured(req) {
  switch (req.provider) {
    case 'anthropic':
      return chatAnthropic(req)
    case 'openai':
      // Adapter slot — see llmClient OpenAI notes. Not implemented in this POC.
      throw new LlmError('OpenAI provider is not implemented yet.', { code: 'not_implemented' })
    default:
      throw new LlmError(`Unknown provider: ${req.provider}`, { code: 'bad_provider' })
  }
}

async function chatAnthropic({ model, apiKey, system, user, schema, maxTokens = 1500, signal }) {
  if (!apiKey) throw new LlmError('Missing Anthropic API key.', { code: 'no_key' })

  const body = {
    model,
    max_tokens: maxTokens,
    temperature: 0, // fixed rubric grading — minimize run-to-run variance
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { format: { type: 'json_schema', schema } },
  }

  let res
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
    if (e?.name === 'AbortError') throw e
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

  const data = await res.json()
  if (data.stop_reason === 'refusal') {
    throw new LlmError('The model declined to analyze this content.', { code: 'refusal' })
  }

  const textBlock = (data.content || []).find((b) => b.type === 'text')
  if (!textBlock?.text) {
    throw new LlmError('Empty analysis response.', { code: 'empty' })
  }

  let parsed
  try {
    parsed = JSON.parse(textBlock.text)
  } catch {
    throw new LlmError('Could not parse the analysis response.', { code: 'parse' })
  }

  return { parsed, raw: data }
}
