import { describe, it, expect } from 'vitest'
import { STAGES, getStage, stageIndex, nextStage, FIRST_STAGE, LEVELS } from '../data/sysdesign/stages'
import { PROBLEMS, getProblem, DEFAULT_PROBLEM } from '../data/sysdesign/problems'
import { candidateDecisions, type Turn } from '../lib/sysdesign/conversation'

describe('system-design stages', () => {
  it('starts at functional requirements and ends at deep dives', () => {
    expect(FIRST_STAGE.id).toBe('functional')
    expect(STAGES[STAGES.length - 1].id).toBe('deepdives')
  })

  it('every stage carries a full mid/senior/staff rubric', () => {
    for (const s of STAGES) {
      expect(s.levelRubric.mid).toBeTruthy()
      expect(s.levelRubric.senior).toBeTruthy()
      expect(s.levelRubric.staff).toBeTruthy()
    }
  })

  it('navigates stages in order and stops at the end', () => {
    expect(stageIndex('entities')).toBe(2)
    expect(nextStage('functional')!.id).toBe('nonfunctional')
    expect(nextStage('deepdives')).toBeNull()
  })

  it('falls back to the first stage for unknown ids', () => {
    expect(getStage('nope').id).toBe(FIRST_STAGE.id)
  })

  it('only the data-flow stage is optional', () => {
    const optional = STAGES.filter((s) => s.optional).map((s) => s.id)
    expect(optional).toEqual(['dataflow'])
  })

  it('escalation (curveballs) is enabled only on high-level design and deep dives', () => {
    const escalating = STAGES.filter((s) => s.escalate).map((s) => s.id)
    expect(escalating).toEqual(['highlevel', 'deepdives'])
  })

  it('levels run junior → staff', () => {
    expect(LEVELS).toEqual(['junior', 'mid', 'senior', 'staff'])
  })
})

describe('system-design problems', () => {
  it('every problem has stage hints used by the grader', () => {
    for (const p of PROBLEMS) {
      expect(p.statement).toBeTruthy()
      expect(p.hints.functionalReqs.length).toBeGreaterThan(0)
      expect(p.hints.deepDives.length).toBeGreaterThan(0)
    }
  })

  it('falls back to the default problem for unknown ids', () => {
    expect(getProblem('nope').id).toBe(DEFAULT_PROBLEM.id)
  })
})

describe('cross-stage memory', () => {
  it('extracts only the candidate statements from a transcript', () => {
    const transcript: Turn[] = [
      { role: 'candidate', text: 'Use REST.' },
      { role: 'interviewer', text: 'Why REST?' },
      { role: 'candidate', text: 'Simple CRUD, public API.' },
    ]
    expect(candidateDecisions(transcript)).toBe('Use REST. Simple CRUD, public API.')
  })

  it('returns an empty string for an empty or interviewer-only transcript', () => {
    expect(candidateDecisions([])).toBe('')
    expect(candidateDecisions([{ role: 'interviewer', text: 'Hi' }])).toBe('')
  })
})
