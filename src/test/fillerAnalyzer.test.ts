import { describe, it, expect } from 'vitest'
import { analyzeFillers } from '../lib/analyzers/fillerAnalyzer'

describe('analyzeFillers', () => {
  it('counts single-word fillers with word boundaries', () => {
    const r = analyzeFillers('Um, I think, uh, we should, um, ship it.', null)
    expect(r.total).toBe(3)
    expect(r.byWord.um).toBe(2)
    expect(r.byWord.uh).toBe(1)
  })

  it('does not match fillers inside other words', () => {
    // "so" should not match inside "soup"; "um" not inside "umbrella"
    const r = analyzeFillers('I ate soup under an umbrella.', null)
    expect(r.total).toBe(0)
  })

  it('matches multi-word phrases and prefers the longer phrase', () => {
    const r = analyzeFillers('You know, I mean, it works.', null)
    expect(r.byWord['you know']).toBe(1)
    expect(r.byWord['i mean']).toBe(1)
    expect(r.total).toBe(2)
  })

  it('computes per-minute rate from duration', () => {
    // 4 fillers over 120 seconds = 2 per minute
    const r = analyzeFillers('um um um um', 120)
    expect(r.total).toBe(4)
    expect(r.perMinute).toBeCloseTo(2, 5)
  })

  it('returns null rate when duration is missing or zero', () => {
    expect(analyzeFillers('um', null).perMinute).toBeNull()
    expect(analyzeFillers('um', 0).perMinute).toBeNull()
  })

  it('records spans with character offsets', () => {
    const r = analyzeFillers('uh hello', null)
    expect(r.spans).toHaveLength(1)
    expect(r.spans[0]).toEqual({ text: 'uh', index: 0 })
  })

  it('is case-insensitive', () => {
    const r = analyzeFillers('UM and Uh and uh', null)
    expect(r.total).toBe(3)
  })

  it('handles empty input', () => {
    const r = analyzeFillers('', 60)
    expect(r.total).toBe(0)
    expect(r.perMinute).toBe(0)
  })
})
