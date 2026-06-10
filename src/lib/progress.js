// Step completion logic — drives the rail indicators and case-list progress.

import { allIcamFactors } from './model.js';

export const STEPS = [
  { key: 'details', label: 'Incident details' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'fiveWhys', label: '5 Whys' },
  { key: 'icam', label: 'ICAM analysis' },
  { key: 'hfat', label: 'mini-HFAT' },
  { key: 'actions', label: 'Actions' },
  { key: 'report', label: 'Report' },
];

const status = (done, started) => (done ? 'done' : started ? 'started' : 'empty');

export const stepStatus = (inv) => {
  const d = inv.details;
  const detailsDone =
    inv.title && d.occurredOn && d.severity && d.type && d.description;
  const detailsStarted =
    d.occurredOn ||
    d.occurredTime ||
    d.location ||
    d.site ||
    d.reportedBy ||
    d.lead ||
    d.severity ||
    d.type ||
    d.description ||
    d.immediateActions;

  const fw = inv.fiveWhys;
  const answered = fw.whys.filter((w) => w.answer.trim()).length;

  const icamAll = allIcamFactors(inv);

  return {
    details: status(detailsDone, detailsStarted),
    evidence: status(inv.evidence.length >= 1, inv.evidence.length >= 1),
    interviews: status(
      inv.interviews.some((i) => i.notes.freeRecall.trim()),
      inv.interviews.length >= 1
    ),
    timeline: status(inv.timeline.length >= 2, inv.timeline.length >= 1),
    fiveWhys: status(
      fw.problem.trim() && answered >= 3 && fw.rootCause.trim(),
      fw.problem.trim() || answered > 0 || fw.rootCause.trim()
    ),
    icam: status(
      inv.icam.of.length >= 1 && icamAll.length >= 2,
      icamAll.length >= 1
    ),
    hfat: status(
      inv.hfat.some((h) => h.actionError.type),
      inv.hfat.length >= 1
    ),
    actions: status(
      inv.actions.some((a) => a.title.trim() && a.owner.trim() && a.due),
      inv.actions.length >= 1
    ),
    report: status(
      inv.report.summary.trim() && inv.report.conclusions.trim(),
      Object.values(inv.report).some((v) => v.trim())
    ),
  };
};

export const overallProgress = (inv) => {
  const s = stepStatus(inv);
  const done = STEPS.filter(({ key }) => s[key] === 'done').length;
  return { done, total: STEPS.length, fraction: done / STEPS.length };
};
