// The system-design interview stages, in order. Each stage is DATA: its goal, what the
// interviewer should probe for, a time budget, and — the core IP — a mid/senior/staff
// leveling rubric. The conversation engine turns `goal` + `probeFor` + `levelRubric` into
// the interviewer's system prompt; the final report uses `levelRubric` to grade the stage.
//
// `optional: true` stages can be skipped (the candidate decides), mirroring how data flow
// is skipped for systems without a meaningful processing sequence.

export const STAGES = [
  {
    id: 'functional',
    label: 'Functional requirements',
    minutes: 5,
    goal: 'Establish what users and clients can do, then prioritize the top ~3.',
    probeFor: [
      'Asking targeted, customer/PM-style clarifying questions ("Does it need to do X? What happens if Y?")',
      'Prioritizing to the top ~3 requirements rather than listing everything',
      'Requirements that are scoped to THIS product, not generic',
    ],
    levelRubric: {
      mid: 'Lists plausible requirements but waits to be prompted; little prioritization; few or no clarifying questions.',
      senior:
        'Asks sharp clarifying questions, proposes a clear top-3, and scopes out-of-bounds features explicitly.',
      staff:
        'Frames requirements around the actual product/business goal, surfaces the non-obvious requirement, and ruthlessly prioritizes with a stated rationale.',
    },
  },
  {
    id: 'nonfunctional',
    label: 'Non-functional requirements',
    minutes: 5,
    goal: 'Identify the qualities that matter most for THIS system — relevant and quantified.',
    probeFor: [
      'NFRs tied to this system, not generic ("low latency" alone is meaningless)',
      'Quantified targets (e.g. "search < 500ms", "scale to 100M DAU")',
      'Picking the ~3 most relevant from: CAP/consistency-vs-availability, scalability, latency, durability, security, fault tolerance, compliance, environment constraints',
    ],
    levelRubric: {
      mid: 'Names generic qualities ("scalable", "fast") without numbers or justification for why they matter here.',
      senior:
        'Quantifies the 2-3 NFRs that matter for this system and explains why (e.g. read-heavy → optimize read latency).',
      staff:
        'Connects NFRs to product and business consequences, makes an explicit CAP/tradeoff call, and identifies the unique scaling challenge (bursty, read vs write skew).',
    },
  },
  {
    id: 'entities',
    label: 'Core entities',
    minutes: 2,
    goal: 'Name the core entities the API exchanges and the system persists — not the full data model.',
    probeFor: [
      'A small set of core nouns/resources (actors + resources to satisfy the FRs)',
      'Resisting the urge to enumerate every column/field this early',
      'Entities that map cleanly to the functional requirements',
    ],
    levelRubric: {
      mid: 'Lists entities but either over-specifies fields too early or misses a central entity.',
      senior:
        'Picks the right core entities, keeps them lean, and ties them to the requirements and actors.',
      staff:
        'Identifies the entity/relationship that will drive the hard parts later (e.g. the follow graph, the geo index) and flags it.',
    },
  },
  {
    id: 'api',
    label: 'API / system interface',
    minutes: 5,
    goal: 'Define the contract between system and clients — usually one endpoint per functional requirement.',
    probeFor: [
      'Choosing a protocol with a reason: REST, GraphQL, or RPC (service-to-service)',
      'Endpoints that cover the functional requirements',
      'Sensible request/response shapes; pagination/cursors where reads are large',
    ],
    levelRubric: {
      mid: 'Defines endpoints that mostly cover the FRs but with little thought to protocol choice or edge cases.',
      senior:
        'Clean contract mapped to the FRs, justified protocol choice, handles pagination/auth/idempotency where relevant.',
      staff:
        'Designs the contract for evolution and scale (cursors, idempotency keys, versioning) and anticipates client needs.',
    },
  },
  {
    id: 'dataflow',
    label: 'Data flow',
    minutes: 5,
    optional: true,
    goal: 'For data-processing systems, sketch the high-level sequence of actions on the input. Skip if the system has no meaningful sequence.',
    probeFor: [
      'A simple ordered list of processing steps (e.g. fetch → parse → extract → store → repeat)',
      'Recognizing when this stage is NOT needed and skipping it',
    ],
    levelRubric: {
      mid: 'Either forces a flow where none is needed or gives a vague sequence.',
      senior: 'Captures a clear, correct processing sequence that sets up the high-level design.',
      staff: 'Identifies the bottleneck step in the flow before drawing anything.',
    },
  },
  {
    id: 'highlevel',
    label: 'High-level design',
    minutes: 12,
    escalate: true,
    goal: 'Lay out the components and how they interact to satisfy the API — simple first, complexity noted for deep dives.',
    probeFor: [
      'Building the design to satisfy each API endpoint, walking through data flow and state changes',
      'Staying simple — NOT layering caches/queues/sharding prematurely (note them for deep dives instead)',
      'Documenting the few relevant fields/columns at the persistence layer (not every column)',
    ],
    levelRubric: {
      mid: 'Produces a working high-level design but over-complicates early or leaves gaps in the request path.',
      senior:
        'Clean design that satisfies every endpoint, explains data flow and state changes, and defers complexity to deep dives deliberately.',
      staff:
        'Keeps the core simple and obviously correct, articulates where complexity WILL go and why, and reasons about data flow end-to-end without prompting.',
    },
  },
  {
    id: 'deepdives',
    label: 'Deep dives',
    minutes: 12,
    escalate: true,
    goal: 'Harden the design: meet the NFRs, address edge cases, find and fix bottlenecks.',
    probeFor: [
      'Proactively driving improvements that satisfy the non-functional requirements',
      'Identifying bottlenecks and edge cases, and reasoning through tradeoffs (not just naming a fix)',
      'Leaving room for the interviewer — collaboration, not a monologue',
    ],
    levelRubric: {
      mid: 'Needs the interviewer to point out weaknesses; addresses them adequately when prompted.',
      senior:
        'Proactively identifies the main bottleneck, leads a tradeoff discussion, and updates the design to meet the NFRs.',
      staff:
        'Independently drives multiple deep dives into the hardest problems, weighs tradeoffs with cost/failure/evolution in mind, and knows which problem is the interesting one.',
    },
  },
]

export const FIRST_STAGE = STAGES[0]

export function getStage(id) {
  return STAGES.find((s) => s.id === id) || FIRST_STAGE
}

export function stageIndex(id) {
  return STAGES.findIndex((s) => s.id === id)
}

export function nextStage(id) {
  const i = stageIndex(id)
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null
}

// The leveling ladder this feature reports against. Staff is the top target; junior is a
// floor so thin sessions aren't over-credited.
export const LEVELS = ['junior', 'mid', 'senior', 'staff']
export const LEVEL_LABEL = { junior: 'Junior', mid: 'Mid', senior: 'Senior', staff: 'Staff' }
