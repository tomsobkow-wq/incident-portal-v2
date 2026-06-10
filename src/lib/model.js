// Data model, factories and reference taxonomies for the investigation domain.

export const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

export const SEVERITY_COLOR = {
  Critical: 'var(--sev-critical)',
  High: 'var(--sev-high)',
  Medium: 'var(--sev-medium)',
  Low: 'var(--sev-low)',
};

export const INCIDENT_TYPES = [
  'Injury',
  'Near miss',
  'Property damage',
  'Environmental',
  'Process safety',
  'Security',
  'Other',
];

export const EVIDENCE_TYPES = [
  'Photo',
  'Document',
  'Witness account',
  'Physical',
  'Data / records',
];

// ICAM contributing-factor categories, in causal-chain order:
// Organisational Factors → Task/Environmental Conditions →
// Individual/Team Actions → Absent/Failed Defences → Incident
export const ICAM_ORDER = ['of', 'tec', 'ita', 'afd'];

export const ICAM_KINDS = {
  of: {
    label: 'Organisational Factors',
    short: 'OF',
    color: '#6d5a8e',
    hint: 'Underlying organisational causes — training, leadership, culture, resourcing, change management',
    help: [
      'What we are after: decisions and conditions set by the organisation, long before the day of the incident, that shaped everything below.',
      'Was the work planned and resourced realistically?',
      'Did training and supervision actually cover this task?',
      'Were changes (layout, equipment, staffing) risk-assessed?',
      'These are where recurrence is prevented — every OF should end up with a corrective action.',
    ],
    ratings: [
      'Training',
      'Leadership',
      'Culture',
      'Resourcing',
      'Procedures & standards',
      'Change management',
      'Contractor management',
      'Other',
    ],
    ratingLabel: 'Factor type',
  },
  tec: {
    label: 'Task / Environmental Conditions',
    short: 'TEC',
    color: '#44607a',
    hint: 'Workplace conditions that promoted the actions or weakened defences',
    help: [
      'What we are after: the state of the task and workplace at the time — the context that made the actions below more likely.',
      'Time pressure, workload, distraction, fatigue?',
      'Lighting, noise, weather, housekeeping, layout?',
      'Procedures unclear, out of date or impractical? Equipment defective?',
      'Every individual/team action should have at least one condition explaining it.',
    ],
    ratings: [
      'Workload',
      'Procedures',
      'Equipment',
      'Environment',
      'Time pressure',
      'Communication',
      'Other',
    ],
    ratingLabel: 'Condition type',
  },
  ita: {
    label: 'Individual / Team Actions',
    short: 'ITA',
    color: '#c06b1c',
    hint: 'Errors or violations by individuals or teams that led directly to the incident',
    help: [
      'What we are after: what people did or did not do that led directly to the event — described factually, by role not name.',
      'Slip/lapse: right intention, action went wrong or was forgotten.',
      'Mistake: the plan itself was wrong.',
      'Violation: deliberate deviation — ask whether it was routine and tolerated.',
      'ITAs are the starting point of analysis, never the stopping point — keep asking what made them likely.',
    ],
    ratings: ['Slip', 'Lapse', 'Mistake', 'Violation'],
    ratingLabel: 'Error type',
  },
  afd: {
    label: 'Absent / Failed Defences',
    short: 'AFD',
    color: '#a93315',
    hint: 'Barriers that should have prevented the incident or limited its consequences',
    help: [
      'What we are after: the last lines of defence that should have stopped the event or reduced its harm — and why they did not.',
      'Detection: alarms, inspections, supervision?',
      'Protection: guards, barriers, PPE, exclusion zones?',
      'Recovery: emergency response, isolation, escape?',
      'For each, was it absent (never there), failed (there but did not work), or weakened (degraded, bypassed)?',
    ],
    ratings: ['Absent', 'Failed', 'Weakened', 'Held'],
    ratingLabel: 'Barrier state',
  },
};

// mini-HFAT — simplified human-factors analysis of an individual/team action
export const HFAT_ERROR_TYPES = ['Slip', 'Lapse', 'Mistake', 'Violation'];

export const HFAT_COGNITIVE_STAGES = [
  { stage: 'Perception', hint: 'Were the relevant cues noticed?' },
  { stage: 'Interpretation', hint: 'Was the situation correctly understood?' },
  { stage: 'Decision', hint: 'Was an appropriate course of action chosen?' },
  { stage: 'Action', hint: 'Was the chosen action executed as intended?' },
];

export const HFAT_FINDINGS = ['Adequate', 'Partial', 'Inadequate'];

export const HFAT_CONDITIONS = [
  'Fatigue & alertness',
  'Time pressure',
  'Workload & distraction',
  'Competence & familiarity',
  'Communication',
  'Procedures & documentation',
  'Environment & workplace',
  'Equipment & interface',
];

export const HFAT_LEVELS = ['High', 'Medium', 'Low'];

// Corrective actions — hierarchy of control
export const ACTION_HIERARCHY = [
  'Elimination',
  'Substitution',
  'Engineering control',
  'Administrative control',
  'PPE',
];

export const ACTION_STATUS = ['Proposed', 'Approved', 'In progress', 'Complete'];

// Analysis methods — selectable per investigation
export const METHODS = [
  { key: 'fiveWhys', label: '5 Whys' },
  { key: 'icam', label: 'ICAM' },
  { key: 'hfat', label: 'mini-HFAT' },
];

// PEEPO — brainstorming lens inside ICAM: lines of enquiry + where the
// evidence sits across People / Environment / Equipment / Procedures / Organisation
export const PEEPO_CATEGORIES = [
  {
    key: 'People',
    hint: 'Who was involved, supervising, nearby? Competence, fatigue, communication.',
    help: [
      'What we are after: everyone whose actions, decisions or absence mattered — by role, not blame.',
      'Who was doing the task, supervising, working nearby?',
      'Were they trained, experienced, fit for work (fatigue, stress)?',
      'Who has not been spoken to yet?',
    ],
  },
  {
    key: 'Environment',
    hint: 'Lighting, weather, noise, housekeeping, layout, time of day.',
    help: [
      'What we are after: the physical surroundings at the moment of the event.',
      'Lighting, weather, temperature, noise, visibility?',
      'Housekeeping, access routes, layout, congestion?',
      'What did the scene look like before anything was moved?',
    ],
  },
  {
    key: 'Equipment',
    hint: 'Plant, tools, materials, interfaces, maintenance state.',
    help: [
      'What we are after: every piece of plant, tool or material involved.',
      'Was it the right equipment, in good condition, maintained on schedule?',
      'Any alarms, guards or interlocks — did they work?',
      'Where are the maintenance and inspection records?',
    ],
  },
  {
    key: 'Procedures',
    hint: 'Rules, permits, SOPs — did they exist, fit the task, get followed?',
    help: [
      'What we are after: the rules the task was supposed to run under.',
      'Did a procedure exist, and did it match how the job is really done?',
      'Permits, risk assessments, toolbox talks — completed and current?',
      'If practice differed from paper, since when, and who knew?',
    ],
  },
  {
    key: 'Organisation',
    hint: 'Planning, resourcing, training, change management, culture.',
    help: [
      'What we are after: how the organisation set this work up to succeed or fail.',
      'Planning, scheduling and resourcing of the task?',
      'Training programmes, supervision arrangements, contractor management?',
      'Recent changes — and whether anyone re-assessed the risk after them.',
    ],
  },
];

export const PEEPO_STATUS = ['To explore', 'Explored'];

// Cognitive-interview structure
export const INTERVIEW_PHASES = [
  {
    key: 'rapport',
    label: 'Rapport & purpose',
    hint: 'Put the interviewee at ease. Explain this is about learning, not blame.',
  },
  {
    key: 'freeRecall',
    label: 'Free recall',
    hint: 'Ask for an uninterrupted account in their own words. Do not interrupt or correct.',
  },
  {
    key: 'probing',
    label: 'Open probing',
    hint: 'Open questions only — what, how, when, who. Avoid leading or "why didn\'t you…" questions.',
  },
  {
    key: 'clarify',
    label: 'Clarify & summarise',
    hint: 'Play back what you heard and let them correct or add detail.',
  },
  {
    key: 'close',
    label: 'Close & next steps',
    hint: 'Thank them, explain what happens next, and how to reach you with anything they remember later.',
  },
];

// ── factories ────────────────────────────────────────────────

const nextRef = (cases) => {
  const year = new Date().getFullYear();
  const nums = (cases || [])
    .map((c) => /^INV-(\d{4})-(\d+)$/.exec(c.ref))
    .filter((m) => m && Number(m[1]) === year)
    .map((m) => Number(m[2]));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return `INV-${year}-${String(n).padStart(3, '0')}`;
};

export const newInvestigation = (title, cases) => {
  const now = new Date().toISOString();
  return {
    id: uid(),
    schema: 1,
    ref: nextRef(cases),
    title: title.trim(),
    status: 'Open',
    createdAt: now,
    updatedAt: now,
    methods: { fiveWhys: true, icam: true, hfat: true },
    details: {
      occurredOn: '',
      occurredTime: '',
      location: '',
      site: '',
      reportedBy: '',
      lead: '',
      severity: '',
      type: '',
      description: '',
      immediateActions: '',
    },
    evidence: [],
    interviews: [],
    timeline: [],
    fiveWhys: { problem: '', whys: [], rootCause: '' },
    peepo: [],
    icam: { of: [], tec: [], ita: [], afd: [] },
    hfat: [],
    actions: [],
    report: {
      summary: '',
      keyFindings: '',
      conclusions: '',
      preparedBy: '',
      approvedBy: '',
    },
  };
};

export const nextEvidenceRef = (evidence) => {
  const nums = (evidence || [])
    .map((e) => /^E(\d+)$/.exec(e.ref))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  return `E${nums.length ? Math.max(...nums) + 1 : 1}`;
};

export const newEvidence = (evidence) => ({
  id: uid(),
  ref: nextEvidenceRef(evidence),
  type: 'Document',
  title: '',
  description: '',
  source: '',
  collectedOn: '',
  file: null, // { name, type, size, dataUrl } — stored in the browser
});

export const newInterview = () => ({
  id: uid(),
  interviewee: '',
  role: '',
  interviewer: '',
  conductedOn: '',
  notes: { rapport: '', freeRecall: '', probing: '', clarify: '', close: '' },
  questions: [],
  keyPoints: '',
});

export const newQuestion = () => ({ id: uid(), question: '', answer: '' });

export const newTimelineEntry = () => ({
  id: uid(),
  date: '',
  time: '',
  actor: '',
  text: '',
  evidenceIds: [],
});

export const newPeepoItem = (category) => ({
  id: uid(),
  category,
  text: '',
  status: 'To explore',
  evidenceIds: [],
  notes: '',
  factorId: '', // set when transferred to the ICAM factor table
});

export const newWhy = () => ({ id: uid(), answer: '', evidenceIds: [] });

export const newIcamFactor = (kind) => ({
  id: uid(),
  kind,
  text: '',
  rating: '',
  evidenceIds: [],
  notes: '',
});

export const newHfatEntry = () => ({
  id: uid(),
  itaId: '',
  actionError: { type: '', actor: '', description: '' },
  recovery: { opportunity: '', barrier: '', outcome: '' },
  cognition: HFAT_COGNITIVE_STAGES.map(({ stage }) => ({
    stage,
    finding: '',
    note: '',
  })),
  conditions: [],
  summary: '',
});

export const newAction = () => ({
  id: uid(),
  title: '',
  detail: '',
  owner: '',
  due: '',
  hierarchy: '',
  status: 'Proposed',
  factorIds: [],
});

// ── small helpers shared across steps ────────────────────────

export const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Bring investigations saved by older versions up to the current shape.
export const migrateCase = (c) => ({
  ...c,
  methods: c.methods || { fiveWhys: true, icam: true, hfat: true },
  peepo: (c.peepo || []).map((p) => ({ factorId: '', ...p })),
  evidence: (c.evidence || []).map((e) => ({ file: null, ...e })),
  timeline: (c.timeline || []).map((t) => ({ actor: '', ...t })),
  interviews: (c.interviews || []).map((iv) => ({
    ...iv,
    questions:
      iv.questions ||
      (iv.notes?.probing?.trim()
        ? [{ id: uid(), question: 'Probing notes (pre-update)', answer: iv.notes.probing }]
        : []),
  })),
});

export const allIcamFactors = (inv) =>
  ICAM_ORDER.flatMap((k) => inv.icam[k].map((f) => ({ ...f, kind: k })));
