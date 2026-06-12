import { useState } from 'react';
import {
  allIcamFactors,
  fmtDate,
  ICAM_KINDS,
  ICAM_ORDER,
  isOverdue,
} from '../lib/model.js';
import { Button, Field, Icon, Input, SectionHeader, TextArea } from '../components/ui.jsx';
import { useCases } from '../App.jsx';

const sortKey = (t) => `${t.date || '9999-99-99'}T${t.time || '99:99'}`;

// A gentle pre-flight read-through — never blocking, never red. It lists
// what a reviewer would notice, with a shortcut to the step that fixes it.
const PreFlight = ({ inv, summaryOk, findingsOk }) => {
  const { goStep } = useCases();
  const factors = allIcamFactors(inv);
  const checks = [
    { ok: summaryOk, label: 'Executive summary written' },
    { ok: findingsOk, label: 'Findings listed' },
  ];
  if (inv.timeline.length) {
    checks.push({
      ok: inv.timeline.some((t) => t.isIncident),
      label: 'The incident is marked on the timeline',
      step: 'timeline',
      stepLabel: 'Timeline',
    });
  }
  if (inv.methods.icam && factors.length) {
    checks.push({
      ok: factors.every((f) => f.evidenceIds.length > 0),
      label: 'Contributing factors are anchored to evidence',
      step: 'icam',
      stepLabel: 'ICAM analysis',
    });
  }
  if (inv.methods.icam && inv.icam.of.some((f) => f.text.trim())) {
    checks.push({
      ok: inv.icam.of
        .filter((f) => f.text.trim())
        .every((f) => inv.actions.some((a) => a.factorIds.includes(f.id))),
      label: 'Every organisational factor has a corrective action',
      step: 'actions',
      stepLabel: 'Actions',
    });
  }
  if (inv.actions.length) {
    checks.push({
      ok: inv.actions.every((a) => a.owner.trim() && a.due),
      label: 'Actions all have an owner and a due date',
      step: 'actions',
      stepLabel: 'Actions',
    });
  }

  const open = checks.filter((c) => !c.ok);
  if (!open.length) {
    return (
      <div className="preflight all-good no-print">
        <Icon name="check" size={13} />
        Everything the report draws on is in place.
      </div>
    );
  }
  return (
    <div className="preflight no-print">
      <div className="pf-title">Worth a look before this goes out</div>
      <ul>
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'ok' : ''}>
            <span className="pf-ind">{c.ok && <Icon name="check" size={10} />}</span>
            {c.label}
            {!c.ok && c.step && (
              <button className="pf-link" onClick={() => goStep(c.step)}>
                {c.stepLabel} →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Pre = ({ text, placeholder }) =>
  text.trim() ? (
    <p className="pre">{text}</p>
  ) : (
    <p className="placeholder">{placeholder}</p>
  );

export const ReportStep = ({ inv, update }) => {
  const [exporting, setExporting] = useState(false);
  const r = inv.report;
  const set = (key) => (value) =>
    update((c) => ({ ...c, report: { ...c.report, [key]: value } }));

  const timeline = [...inv.timeline].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const factors = allIcamFactors(inv);
  const evRefs = (ids) =>
    ids
      .map((id) => inv.evidence.find((e) => e.id === id)?.ref)
      .filter(Boolean)
      .join(', ');
  const hasActor = timeline.some((t) => t.actor?.trim());
  const anyAnalysis = inv.methods.fiveWhys || inv.methods.icam || inv.methods.hfat;

  // section numbering adapts to which sections exist
  let n = 5;
  const interviewsNum = inv.interviews.length ? n++ : null;
  const analysisNum = anyAnalysis ? n++ : null;
  const findingsNum = n++;
  const actionsNum = n;
  const findingLines = r.keyFindings.split('\n').filter((l) => l.trim());

  const doWord = async () => {
    setExporting(true);
    try {
      // docx is heavy — load it only when actually exporting
      const { exportDocx } = await import('../lib/exportDocx.js');
      await exportDocx(inv);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="rise">
      <div className="no-print">
        <SectionHeader
          title="Report"
          sub="Write the narrative fields, then export. The document below compiles everything captured in the previous steps."
          actions={
            <>
              <Button icon="print" onClick={() => window.print()}>
                Export PDF
              </Button>
              <Button icon="download" onClick={doWord} disabled={exporting}>
                {exporting ? 'Preparing…' : 'Export Word'}
              </Button>
            </>
          }
        />

        <PreFlight
          inv={inv}
          summaryOk={!!r.summary.trim()}
          findingsOk={findingLines.length > 0}
        />

        <div className="grid-2" style={{ marginBottom: 16 }}>
          <Field label="Executive summary" className="span-2">
            <TextArea
              value={r.summary}
              onChange={set('summary')}
              rows={4}
              placeholder="What happened, why, and what will change — in a paragraph a senior manager will actually read."
            />
          </Field>
          <Field
            label="Findings"
            hint="One finding per line — they are numbered in the report. Findings state safety factors, not blame."
          >
            <TextArea
              value={r.keyFindings}
              onChange={set('keyFindings')}
              rows={5}
              placeholder="One finding per line…"
            />
          </Field>
          <Field label="Prepared by">
            <Input value={r.preparedBy} onChange={set('preparedBy')} placeholder="Name, role" />
          </Field>
          <Field label="Approved by">
            <Input value={r.approvedBy} onChange={set('approvedBy')} placeholder="Name, role" />
          </Field>
        </div>
      </div>

      {/* ── compiled document (printed as the PDF) ───────────── */}
      <article className="report-doc" id="report-doc">
        <div className="r-overline">Incident investigation report</div>
        <h1>{inv.title}</h1>
        <div className="mono muted" style={{ fontSize: 11.5 }}>
          {inv.ref} · {inv.status}
        </div>

        <div className="r-meta-grid">
          <div><span className="k">Date occurred</span>{fmtDate(inv.details.occurredOn) || '—'}{inv.details.occurredTime && `, ${inv.details.occurredTime}`}</div>
          <div><span className="k">Type</span>{inv.details.type || '—'}</div>
          <div><span className="k">Site</span>{inv.details.site || '—'}</div>
          <div><span className="k">Severity</span>{inv.details.severity || '—'}</div>
          <div><span className="k">Location</span>{inv.details.location || '—'}</div>
          <div><span className="k">Lead investigator</span>{inv.details.lead || '—'}</div>
          <div><span className="k">Reported by</span>{inv.details.reportedBy || '—'}</div>
          <div><span className="k">Report date</span>{fmtDate(new Date().toISOString())}</div>
        </div>

        <h2>1. Executive summary</h2>
        <Pre text={r.summary} placeholder="No summary written yet." />

        <h2>2. The incident</h2>
        <Pre text={inv.details.description} placeholder="No description recorded." />
        {inv.details.immediateActions.trim() && (
          <>
            <h3>Immediate actions taken</h3>
            <p className="pre">{inv.details.immediateActions}</p>
          </>
        )}

        <h2>3. Sequence of events</h2>
        {timeline.length ? (
          <table>
            <thead>
              <tr><th>Date</th><th>Time</th>{hasActor && <th>Actor</th>}<th>Event</th><th>Evidence</th></tr>
            </thead>
            <tbody>
              {timeline.map((t) => (
                <tr key={t.id} className={t.isIncident ? 'r-incident' : ''}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                  <td>{t.time || '—'}</td>
                  {hasActor && <td style={{ whiteSpace: 'nowrap' }}>{t.actor || '—'}</td>}
                  <td>
                    {t.isIncident && <span className="r-incident-tag">Incident — </span>}
                    {t.text}
                  </td>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>{evRefs(t.evidenceIds) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="placeholder">No timeline entries.</p>
        )}

        <h2>4. Evidence register</h2>
        {inv.evidence.length ? (
          <table>
            <thead>
              <tr><th>Ref</th><th>Type</th><th>Item</th><th>Source</th></tr>
            </thead>
            <tbody>
              {inv.evidence.map((e) => (
                <tr key={e.id}>
                  <td className="mono">{e.ref}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{e.type}</td>
                  <td>
                    {e.title}
                    {e.description && (
                      <span className="muted"> — {e.description}</span>
                    )}
                    {e.file?.type?.startsWith('image/') && (
                      <img
                        src={e.file.dataUrl}
                        alt={e.title}
                        style={{
                          display: 'block',
                          maxWidth: 220,
                          maxHeight: 140,
                          marginTop: 6,
                          borderRadius: 4,
                          border: '1px solid var(--line)',
                        }}
                      />
                    )}
                    {e.file && !e.file.type?.startsWith('image/') && (
                      <span className="muted"> (file: {e.file.name})</span>
                    )}
                  </td>
                  <td>{e.source || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="placeholder">No evidence logged.</p>
        )}

        {inv.interviews.length > 0 && (
          <>
            <h2>{interviewsNum}. Interviews</h2>
            <p>
              {inv.interviews.length} interview{inv.interviews.length > 1 ? 's were' : ' was'}{' '}
              conducted as part of this investigation, with the following:
            </p>
            <ul>
              {inv.interviews.map((iv) => (
                <li key={iv.id}>
                  {iv.role || 'Role not recorded'}
                  {iv.conductedOn && (
                    <span className="muted"> — {fmtDate(iv.conductedOn)}</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="muted" style={{ fontSize: 12 }}>
              Interview records are held in the investigation file and are not reproduced in
              this report.
            </p>
          </>
        )}

        {anyAnalysis && <h2>{analysisNum}. Analysis</h2>}

        {inv.methods.fiveWhys && (
          <>
        <h3>5 Whys</h3>
        {inv.fiveWhys.problem.trim() ? (
          <table>
            <tbody>
              <tr>
                <th style={{ width: 110 }}>Problem</th>
                <td>{inv.fiveWhys.problem}</td>
              </tr>
              {inv.fiveWhys.whys
                .filter((w) => w.answer.trim())
                .map((w, i) => (
                  <tr key={w.id}>
                    <th>Why {i + 1}</th>
                    <td>
                      {w.answer}
                      {w.evidenceIds.length > 0 && (
                        <span className="mono muted"> [{evRefs(w.evidenceIds)}]</span>
                      )}
                    </td>
                  </tr>
                ))}
              {inv.fiveWhys.rootCause.trim() && (
                <tr>
                  <th style={{ color: 'var(--accent)' }}>Root cause</th>
                  <td style={{ fontWeight: 600 }}>{inv.fiveWhys.rootCause}</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="placeholder">5 Whys not completed.</p>
        )}
          </>
        )}

        {inv.methods.icam && (
          <>
        {inv.peepo.length > 0 && (
          <>
            <h3>PEEPO — lines of enquiry</h3>
            <table>
              <thead>
                <tr><th>Category</th><th>Line of enquiry</th><th>Status</th><th>Found</th><th>Evidence</th></tr>
              </thead>
              <tbody>
                {inv.peepo.map((p) => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.category}</td>
                    <td>{p.text}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.status}</td>
                    <td>{p.notes || '—'}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{evRefs(p.evidenceIds) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h3>ICAM contributing factors</h3>
        {factors.length ? (
          <table>
            <thead>
              <tr><th>Category</th><th>Factor</th><th>Classification</th><th>Evidence</th></tr>
            </thead>
            <tbody>
              {ICAM_ORDER.flatMap((k) =>
                inv.icam[k].map((f) => (
                  <tr key={f.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{ICAM_KINDS[k].tag}</td>
                    <td>{f.text}</td>
                    <td>{f.rating || '—'}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{evRefs(f.evidenceIds) || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <p className="placeholder">No ICAM factors recorded.</p>
        )}
          </>
        )}

        {inv.methods.hfat && inv.hfat.length > 0 && (
          <>
            <h3>Human factors (mini-HFAT)</h3>
            {inv.hfat.map((h, i) => (
              <div key={h.id} className="r-block">
                <p>
                  <strong>
                    Analysis {i + 1}
                    {h.actionError.type && ` — ${h.actionError.type}`}
                  </strong>
                  {h.actionError.description && `: ${h.actionError.description}`}
                </p>
                {h.conditions.length > 0 && (
                  <p className="muted" style={{ fontSize: 12 }}>
                    Performance-shaping conditions:{' '}
                    {h.conditions.map((c) => c.condition).join(', ')}
                  </p>
                )}
                {h.summary.trim() && <p className="pre">{h.summary}</p>}
              </div>
            ))}
          </>
        )}

        <h2>{findingsNum}. Findings</h2>
        {findingLines.length ? (
          <>
            <ol>
              {findingLines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
            <p className="muted" style={{ fontSize: 12, fontStyle: 'italic' }}>
              These findings identify safety factors and should not be read as apportioning
              blame or liability to any organisation or individual.
            </p>
          </>
        ) : (
          <p className="placeholder">No findings written yet.</p>
        )}

        <h2>{actionsNum}. Corrective actions</h2>
        {inv.actions.length ? (
          <table>
            <thead>
              <tr><th>Action</th><th>Owner</th><th>Due</th><th>Control</th><th>Status</th></tr>
            </thead>
            <tbody>
              {inv.actions.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.title}
                    {a.detail && <span className="muted"> — {a.detail}</span>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{a.owner || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {fmtDate(a.due) || '—'}
                    {isOverdue(a) && (
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}> (overdue)</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{a.hierarchy || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="placeholder">No corrective actions recorded.</p>
        )}

        <div className="r-meta-grid" style={{ marginTop: 28 }}>
          <div><span className="k">Prepared by</span>{r.preparedBy || '—'}</div>
          <div><span className="k">Approved by</span>{r.approvedBy || '—'}</div>
        </div>
      </article>
    </section>
  );
};
