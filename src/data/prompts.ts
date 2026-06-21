// The most common behavioral interview questions, grouped by competency. Fixed wording so
// sessions on the same prompt are comparable over time. Each carries prep guidance:
//   assesses — what the interviewer is really evaluating
//   tip      — one specific pointer
//   trap     — the common mistake that sinks this answer
//   avoid    — what to leave out

export interface Prompt {
  id: string
  category: string
  label: string
  text: string
  assesses: string
  tip: string
  trap: string
  avoid: string
}

// A reusable way to think through ANY behavioral answer. Ordered. The outcome-first step
// is deliberately near the top — burying the result is the most common delivery mistake.
export const ANSWER_FRAMEWORK: string[] = [
  'Pick a story with a real, concrete outcome — ideally one you can put a number on.',
  'Lead with the headline. Open with the result/impact in one sentence, THEN tell the story. Don’t make them wait for the payoff.',
  'Set the scene fast: 1–2 sentences of Situation + Task. Just enough context, no scene-painting.',
  'Spend most of your time on YOUR Actions — the decisions and tradeoffs you made (say “I”, not “we”). Stay at the altitude of decisions, not every step.',
  'Close the loop: state the Result, tie it back to your opening headline, and add one sentence on what you learned.',
  'Aim for ~2 minutes. If you’re past 3, you’re over-detailing.',
]

export const PROMPTS: Prompt[] = [
  // Conflict & disagreement
  {
    id: 'conflict-teammate',
    category: 'Conflict',
    label: 'Disagreement with a teammate',
    text: 'Tell me about a time you disagreed with a teammate. What was the situation, what did you do, and how did it turn out?',
    assesses: 'Whether you can disagree without damaging the relationship, and reach a good outcome.',
    tip: 'Show you sought to understand their view first; end on the resolution and what it produced, not the friction.',
    trap: 'Casting the teammate as the villain and yourself as the one who “won.” It reads as poor collaboration.',
    avoid: 'Badmouthing them, a blow-by-blow of the argument, or framing it as winning.',
  },
  {
    id: 'conflict-manager',
    category: 'Conflict',
    label: 'Disagreement with your manager',
    text: "Describe a time you disagreed with your manager's decision. What did you do, and what was the result?",
    assesses: 'Backbone plus judgment — can you push back respectfully and then commit.',
    tip: 'Lead with the outcome, then how you raised it with data and disagreed-and-committed.',
    trap: 'Sounding either insubordinate or like a pushover who caved the instant you were challenged.',
    avoid: 'A trivial disagreement, or ending on “they were wrong and I was right.”',
  },

  // Failure & mistakes
  {
    id: 'failure-project',
    category: 'Failure & mistakes',
    label: 'A project that failed',
    text: 'Describe a time a project of yours failed or missed its goal. What happened and what did you learn?',
    assesses: 'Ownership and growth — do you take responsibility and extract a real lesson.',
    tip: 'Own your part without over-apologizing; spend the most time on what you changed afterward.',
    trap: 'A humble-brag “failure” (“I cared too much”) or blaming the team, market, or bad luck.',
    avoid: 'Deflecting blame, or a failure with no lesson and no real stake for you.',
  },
  {
    id: 'mistake-owned',
    category: 'Failure & mistakes',
    label: 'A significant mistake',
    text: 'Tell me about a significant mistake you made at work. How did you handle it and what changed afterward?',
    assesses: 'Accountability and how you respond under your own error.',
    tip: 'State the impact up front, then the fix and the systemic change so it can’t recur.',
    trap: 'Picking something trivial to look safe — or something so severe it raises judgment red flags.',
    avoid: 'Minimizing it, over-apologizing, or shifting blame to others.',
  },

  // Leadership & influence
  {
    id: 'leadership-led',
    category: 'Leadership & influence',
    label: 'Leading a project or team',
    text: 'Give an example of a time you took the lead on something. What did you do and what was the result?',
    assesses: 'Initiative, coordination, and the scope of impact you can drive.',
    tip: 'Lead with the result and your scope; then how you set direction and unblocked others.',
    trap: 'Slipping into “we” the whole time so your individual contribution disappears.',
    avoid: 'Narrating the full project plan, or taking credit for the team’s work.',
  },
  {
    id: 'influence-no-authority',
    category: 'Leadership & influence',
    label: 'Influencing without authority',
    text: 'Describe a time you had to influence people or drive a decision without formal authority over them.',
    assesses: 'Persuasion, building coalitions, and earning trust.',
    tip: 'Focus on how you understood their incentives and won them over — name the decision that resulted.',
    trap: 'Framing influence as “I convinced them I was right” instead of meeting their actual needs.',
    avoid: 'Making it about being the smartest in the room, or a case where you actually had authority.',
  },

  // Teamwork & collaboration
  {
    id: 'teamwork-difficult',
    category: 'Teamwork',
    label: 'A difficult teammate',
    text: 'Tell me about a time you had to work closely with someone difficult. How did you make it work?',
    assesses: 'Empathy and professionalism under interpersonal friction.',
    tip: 'Stay generous about the other person; show what you changed in your own approach.',
    trap: 'Turning it into a character assassination — it tells the interviewer how you’ll talk about them later.',
    avoid: 'Dwelling on how awful they were, or picking someone you just personally disliked.',
  },

  // Ambiguity & decisions
  {
    id: 'ambiguity-decision',
    category: 'Ambiguity & judgment',
    label: 'Deciding with incomplete info',
    text: 'Describe a time you had to make an important decision with incomplete information. How did you approach it?',
    assesses: 'Judgment, bias for action, and how you reason under uncertainty.',
    tip: 'Name the result first; then the few signals you weighed and why you decided when you did.',
    trap: 'Coming across as either frozen (waited for perfect data) or reckless (gut call, no reasoning).',
    avoid: 'Claiming you had no process, or a decision with no real stakes.',
  },
  {
    id: 'complex-project',
    category: 'Ambiguity & judgment',
    label: 'Most complex project you drove',
    text: 'Walk me through the most complex or ambiguous project you owned end to end. What made it hard and what did you do?',
    assesses: 'Scope, ownership, and how you break down hard problems.',
    tip: 'Resist narrating every detail — give the outcome, then the 2–3 hardest decisions you made.',
    trap: 'Drowning the interviewer in architecture and losing the thread of YOUR decisions and impact.',
    avoid: 'Technical detail for its own sake, and any part you didn’t personally drive.',
  },

  // Execution & pressure
  {
    id: 'deadline-pressure',
    category: 'Execution',
    label: 'Delivering under pressure',
    text: 'Tell me about a time you had to deliver something important under a tight deadline.',
    assesses: 'Prioritization and composure when the clock is against you.',
    tip: 'Lead with whether you delivered; then how you cut scope or sequenced work to get there.',
    trap: 'Glorifying the all-nighter as the solution instead of the smart prioritization.',
    avoid: 'Celebrating heroics/crunch, or implying poor planning caused it with no fix.',
  },
  {
    id: 'competing-priorities',
    category: 'Execution',
    label: 'Competing priorities',
    text: 'Describe a time you had to juggle competing priorities. How did you decide what to do first?',
    assesses: 'Decision-making and how you reason about tradeoffs.',
    tip: 'Make the decision criteria explicit (impact, urgency, who you consulted), not just the busywork.',
    trap: 'Listing everything you did without ever showing the criteria you used to choose.',
    avoid: 'A to-do list, or “I just worked harder and did it all.”',
  },
  {
    id: 'initiative-above-beyond',
    category: 'Execution',
    label: 'Going above and beyond',
    text: 'Tell me about a time you went beyond what was expected of you. What drove you and what was the impact?',
    assesses: 'Ownership and intrinsic drive.',
    tip: 'Anchor on the impact; make clear it was self-initiated, not assigned.',
    trap: 'Picking something that was actually your job, or that created cleanup work for others.',
    avoid: 'Routine work dressed up, or framing it as ignoring your real responsibilities.',
  },

  // Growth & feedback
  {
    id: 'feedback-received',
    category: 'Growth & feedback',
    label: 'Receiving hard feedback',
    text: 'Describe a time you received difficult feedback. How did you respond and what did you change?',
    assesses: 'Self-awareness and coachability.',
    tip: 'Don’t get defensive in the retelling; spend the time on the concrete change you made.',
    trap: 'Picking feedback you secretly disagreed with — your defensiveness leaks through.',
    avoid: 'Trivial feedback, or any sign you dismissed it.',
  },
  {
    id: 'feedback-given',
    category: 'Growth & feedback',
    label: 'Giving hard feedback',
    text: 'Tell me about a time you had to give critical feedback to a peer or report. How did you handle it?',
    assesses: 'Directness with care, and whether it landed.',
    tip: 'Show you were specific and kind; end with how the person/outcome improved.',
    trap: 'Coming off as harsh and blunt — or so soft that the message never actually landed.',
    avoid: 'Making the other person look incompetent, or feedback that wasn’t really received.',
  },
  {
    id: 'learn-fast',
    category: 'Growth & feedback',
    label: 'Learning something quickly',
    text: 'Tell me about a time you had to get up to speed on something unfamiliar very quickly.',
    assesses: 'Learning agility and resourcefulness.',
    tip: 'Lead with what you shipped/achieved; then the method you used to ramp fast.',
    trap: 'Explaining the topic in depth instead of your method and the outcome.',
    avoid: 'Lecturing on what you learned, or picking something trivial.',
  },

  // Impact
  {
    id: 'proudest-accomplishment',
    category: 'Impact',
    label: 'Proudest accomplishment',
    text: "What's the accomplishment you're most proud of, and what was your specific contribution?",
    assesses: 'What you value, and your real (vs. team) contribution.',
    tip: 'Open with the impact and your specific role; be precise about what was YOURS.',
    trap: 'A team win where your individual role is fuzzy, or something under-scaled for the role.',
    avoid: 'Vagueness about what was yours; a purely personal item unless it shows relevant skills.',
  },
  {
    id: 'stakeholder-unhappy',
    category: 'Impact',
    label: 'An unhappy stakeholder',
    text: 'Describe a time you turned around an unhappy customer or stakeholder. What did you do?',
    assesses: 'Composure, empathy, and recovery.',
    tip: 'State where it ended up first (recovered the relationship/deal), then how you got there.',
    trap: 'Blaming the stakeholder for being unreasonable instead of owning the recovery.',
    avoid: 'Making them the villain, or skipping how you actually fixed it.',
  },

  // Non-technical stakeholders
  {
    id: 'stakeholder-explain-technical',
    category: 'Non-technical stakeholders',
    label: 'Explaining something technical',
    text: 'Tell me about a time you had to explain a complex technical concept or tradeoff to a non-technical audience. How did you get the point across?',
    assesses: 'Communication — translating technical depth into business terms.',
    tip: 'Lead with whether they understood/decided well; then the analogy or framing you used.',
    trap: 'Re-explaining the tech in depth to the interviewer — which proves you’d do it to the stakeholder too.',
    avoid: 'Jargon and deep technical detail; focus on the simplification and that it landed.',
  },
  {
    id: 'stakeholder-manage-expectations',
    category: 'Non-technical stakeholders',
    label: 'Managing expectations',
    text: 'Describe a time a non-technical stakeholder expected something that was not feasible (timeline, scope, or cost). How did you handle it?',
    assesses: 'Honesty, framing tradeoffs, and protecting trust.',
    tip: 'Show how you reframed in their terms (cost/risk/value) and offered options, not just “no”.',
    trap: 'Positioning yourself as the gatekeeper who simply said no.',
    avoid: 'Being the blocker, or skipping the options/tradeoffs you offered.',
  },
  {
    id: 'stakeholder-say-no',
    category: 'Non-technical stakeholders',
    label: 'Pushing back on a request',
    text: 'Tell me about a time you had to say no to, or redirect, a request from a business or product stakeholder. How did you keep the relationship intact?',
    assesses: 'Backbone plus diplomacy with cross-functional partners.',
    tip: 'Make the “why” about shared goals; end on the alternative you aligned on.',
    trap: 'Turning it into engineering-vs-business — or caving entirely to avoid the conflict.',
    avoid: 'An us-vs-them tone, or omitting how you preserved the relationship.',
  },
  {
    id: 'stakeholder-align',
    category: 'Non-technical stakeholders',
    label: 'Aligning conflicting stakeholders',
    text: 'Describe a time you had to align stakeholders from different functions (e.g. product, sales, design) who wanted different things. How did you reach a decision?',
    assesses: 'Facilitation and driving to a decision across competing interests.',
    tip: 'Name the decision and outcome first; then how you surfaced tradeoffs and built consensus.',
    trap: 'Casting yourself as the one who “decided” without showing how you built buy-in.',
    avoid: 'Skipping the conflict resolution, or claiming you overruled everyone.',
  },

  // Managerial round — the hiring-manager screen: fit, motivation, working style, and
  // trajectory. Less "tell me about a time," more "who are you and why this." Be concise and
  // specific; vague or generic answers are the killer here.
  {
    id: 'mgr-tell-me-about-yourself',
    category: 'Managerial round',
    label: 'Walk me through your background',
    text: 'Tell me about yourself — walk me through your background and what brought you here.',
    assesses: 'Whether you can frame your story crisply and point it at THIS role.',
    tip: 'A 90-second arc: where you started → a couple of pivotal moves and what you’re great at → why this role is the logical next step. Rehearse it.',
    trap: 'A chronological resume read-through with no throughline, or rambling past two minutes.',
    avoid: 'Personal history, every job you’ve held, and detail that doesn’t build toward this role.',
  },
  {
    id: 'mgr-why-company',
    category: 'Managerial round',
    label: 'Why this company / role',
    text: 'Why are you interested in this company and this role specifically?',
    assesses: 'Genuine motivation and whether you’ve done your homework — the #1 HM signal.',
    tip: 'Be specific to the product and mission (use it, name what you respect), then connect it to what you want to do next. Show you chose them, not just “a job.”',
    trap: 'Generic praise that could apply to any company (“great team, fast growth”).',
    avoid: 'Flattery with no specifics, or making it only about comp/title/location.',
  },
  {
    id: 'mgr-next-role',
    category: 'Managerial round',
    label: 'What you want in your next role',
    text: 'What are you looking for in your next role, and what would make this a great move for you?',
    assesses: 'Whether your goals match what the role and team can actually offer.',
    tip: 'Name 2–3 concrete things (scope, problem space, growth) that this role genuinely provides — align your wants with their reality.',
    trap: 'Wants that the role can’t satisfy, signaling you’ll be unhappy or leave quickly.',
    avoid: 'A vague “new challenges,” or a wishlist that contradicts the job.',
  },
  {
    id: 'mgr-why-leaving',
    category: 'Managerial round',
    label: 'Why you’re leaving',
    text: 'Why are you looking to leave your current role?',
    assesses: 'Maturity and whether you speak about people/situations with grace.',
    tip: 'Frame it forward-looking: what you’re moving toward, not just away from. Keep it brief and honest.',
    trap: 'Badmouthing your current employer or manager — it tells them how you’ll talk about them.',
    avoid: 'Bitterness, blame, or airing grievances; over-explaining.',
  },
  {
    id: 'mgr-management-style',
    category: 'Managerial round',
    label: 'How you like to be managed',
    text: 'How do you like to be managed, and what do you need from a manager to do your best work?',
    assesses: 'Self-awareness and whether you and the manager will work well together.',
    tip: 'Be specific and two-way (e.g. “context and the why up front, then autonomy; direct feedback early”). Show you’re easy to work with, not high-maintenance.',
    trap: 'Answers that imply you need heavy hand-holding or, conversely, that you ignore direction.',
    avoid: '“I’m low-maintenance, whatever works” — it dodges the question and reads as no self-awareness.',
  },
  {
    id: 'mgr-strengths-growth',
    category: 'Managerial round',
    label: 'Strengths and growth areas',
    text: 'What are your biggest strengths, and where are you actively trying to grow?',
    assesses: 'Honest self-assessment and whether you invest in your own development.',
    tip: 'Pick a real growth area (not a humble-brag) and show the concrete steps you’re taking on it. Tie strengths to what the role needs.',
    trap: 'The fake weakness (“I work too hard / care too much”), which reads as evasive.',
    avoid: 'A weakness that’s disqualifying for the role, or strengths with no evidence.',
  },
  {
    id: 'mgr-ambiguity-startup',
    category: 'Managerial round',
    label: 'Operating in ambiguity',
    text: 'This is an early-stage, fast-moving environment with a lot of ambiguity. How do you operate when priorities and scope are unclear?',
    assesses: 'Fit for a startup: bias for action, self-direction, comfort without a playbook.',
    tip: 'Give a concrete example of creating clarity yourself — scoping, picking a direction, shipping, and adjusting — rather than waiting to be told.',
    trap: 'Sounding like you need process and clear specs to function.',
    avoid: 'Abstract claims (“I’m flexible”) with no example of you driving in the fog.',
  },
  {
    id: 'mgr-managing-up',
    category: 'Managerial round',
    label: 'Managing up',
    text: 'Tell me about a time you managed up — kept your manager informed, pushed for a decision, or changed their mind.',
    assesses: 'Communication, judgment about what to escalate, and partnering with leadership.',
    tip: 'Show the right altitude: you surfaced the right things at the right time and drove to a decision — name the outcome.',
    trap: 'Either going around your manager, or never raising anything until it became a fire.',
    avoid: 'Framing it as outsmarting your manager; skip the org politics.',
  },
]

export const DEFAULT_PROMPT = PROMPTS[0]

// Stable category order for grouping in the picker.
export const PROMPT_CATEGORIES = PROMPTS.reduce<string[]>((acc, p) => {
  if (!acc.includes(p.category)) acc.push(p.category)
  return acc
}, [])
