import { useEffect, useRef, useState } from 'react';
import {
  fmtDate,
  INTERVIEW_PHASES,
  newEvidence,
  newInterview,
  newQuestion,
  newTimelineEntry,
} from '../lib/model.js';
import {
  AutoTextArea,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  SectionHeader,
  Tag,
} from '../components/ui.jsx';

const QAEditor = ({ questions, onChange, onTextSelect }) => {
  const setQ = (id, patch) =>
    onChange(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  return (
    <div>
      {questions.map((q, i) => (
        <div key={q.id} className="qa-row">
          <div className="q-fields">
            <div className="qa-label">Question {i + 1}</div>
            <Input
              value={q.question}
              onChange={(v) => setQ(q.id, { question: v })}
              placeholder="The question as asked — open, not leading"
              aria-label={`Question ${i + 1}`}
            />
            <div className="qa-label">Response</div>
            <AutoTextArea
              value={q.answer}
              onChange={(v) => setQ(q.id, { answer: v })}
              minRows={4}
              placeholder="Their response, as close to verbatim as possible"
              aria-label={`Response ${i + 1}`}
              onSelect={onTextSelect}
            />
          </div>
          <IconButton
            icon="trash"
            label={`Remove question ${i + 1}`}
            danger
            onClick={() => onChange(questions.filter((x) => x.id !== q.id))}
          />
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <Button size="sm" icon="plus" onClick={() => onChange([...questions, newQuestion()])}>
          Add question
        </Button>
      </div>
    </div>
  );
};

// Full-page workspace, not a modal — long verbatim accounts need the room.
// Fields grow with their content so nothing is read through a letterbox.
const InterviewEditor = ({ initial, onSave, onAutosave, onCancel, onSendToTimeline }) => {
  const [draft, setDraft] = useState(initial);
  const [sel, setSel] = useState('');
  const [sentNote, setSentNote] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const sentTimer = useRef(null);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const setNote = (key) => (value) =>
    setDraft((d) => ({ ...d, notes: { ...d.notes, [key]: value } }));
  const valid = draft.interviewee.trim();

  // Nothing typed here should ever be lost: the draft autosaves every five
  // minutes and whenever the editor is left any way other than Discard.
  const draftRef = useRef(draft);
  const autosaveRef = useRef(onAutosave);
  const discardedRef = useRef(false);
  useEffect(() => {
    draftRef.current = draft;
    autosaveRef.current = onAutosave;
  });
  useEffect(() => {
    const tick = setInterval(() => {
      if (draftRef.current.interviewee.trim()) {
        autosaveRef.current(draftRef.current);
        setSavedAt(new Date());
      }
    }, 5 * 60 * 1000);
    return () => {
      clearInterval(tick);
      if (!discardedRef.current && draftRef.current.interviewee.trim()) {
        autosaveRef.current(draftRef.current);
      }
    };
  }, []);
  const discard = () => {
    discardedRef.current = true;
    onCancel();
  };

  // Track text selections inside the account fields — anything highlighted
  // can be sent straight to the timeline as a draft entry.
  const trackSelection = (e) => {
    const el = e.target;
    setSel(el.value.slice(el.selectionStart, el.selectionEnd).trim());
  };

  const sendToTimeline = () => {
    if (!sel) return;
    onSendToTimeline(sel, draft.interviewee);
    setSel('');
    setSentNote(true);
    clearTimeout(sentTimer.current);
    sentTimer.current = setTimeout(() => setSentNote(false), 5000);
  };

  return (
    <section className="rise iv-editor">
      <div className="iv-editor-bar">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="overline">Interview</div>
          <h2 style={{ fontSize: 21 }}>
            {draft.interviewee.trim() || 'New interview'}
          </h2>
        </div>
        <span className="iv-autosave">
          {savedAt
            ? `Autosaved ${savedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
            : 'Autosaves every 5 minutes'}
        </span>
        <Button onClick={discard}>Discard</Button>
        <Button variant="primary" disabled={!valid} onClick={() => onSave(draft)}>
          Save interview
        </Button>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <Field label="Interviewee">
          <Input value={draft.interviewee} onChange={set('interviewee')} placeholder="Name" />
        </Field>
        <Field label="Role / involvement">
          <Input
            value={draft.role}
            onChange={set('role')}
            placeholder="e.g. Forklift operator — involved"
          />
        </Field>
        <Field label="Interviewer">
          <Input value={draft.interviewer} onChange={set('interviewer')} placeholder="Name" />
        </Field>
        <Field label="Conducted on">
          <input
            className="input"
            type="date"
            value={draft.conductedOn}
            onChange={(e) => set('conductedOn')(e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Cognitive interview notes"
        hint="The five phases below follow cognitive-interview practice: build rapport, get an uninterrupted free-recall account, then probe with open questions only. Highlight any passage that pins down a moment in time and send it to the timeline."
      >
        <div>
          {INTERVIEW_PHASES.map((p, i) => (
            <div className="phase-block" key={p.key}>
              <div className="ph-head">
                <span className="n">{i + 1}</span>
                {p.label}
                <span className="muted" style={{ fontWeight: 400, marginLeft: 4 }}>
                  — {p.hint}
                </span>
              </div>
              {p.key === 'probing' ? (
                <div style={{ padding: 10, background: 'var(--surface)' }}>
                  <QAEditor
                    questions={draft.questions}
                    onChange={(qs) => set('questions')(qs)}
                    onTextSelect={trackSelection}
                  />
                </div>
              ) : (
                <AutoTextArea
                  value={draft.notes[p.key]}
                  onChange={setNote(p.key)}
                  minRows={p.key === 'freeRecall' ? 10 : 2}
                  placeholder={p.key === 'freeRecall' ? 'Their account, in their words…' : ''}
                  aria-label={p.label}
                  onSelect={trackSelection}
                />
              )}
            </div>
          ))}
        </div>
      </Field>

      <Field
        label="Key points"
        hint="The facts this interview establishes — these appear on the interview card and in the report."
      >
        <AutoTextArea
          value={draft.keyPoints}
          onChange={set('keyPoints')}
          minRows={3}
          placeholder="One point per line…"
        />
      </Field>

      <div className={`sel-bar no-print ${sel || sentNote ? '' : 'idle'}`}>
        {sentNote && !sel ? (
          <span className="sb-done">
            <Icon name="check" size={13} />
            Added to the timeline as a draft — set its date and time in the
            Timeline step.
          </span>
        ) : sel ? (
          <>
            <span className="sb-text">“{sel.length > 90 ? `${sel.slice(0, 90)}…` : sel}”</span>
            <Button size="sm" variant="primary" icon="clock" onClick={sendToTimeline}>
              Send to timeline
            </Button>
          </>
        ) : (
          <span className="sb-idle">
            <Icon name="clock" size={13} />
            Highlight any passage of the account with your mouse and it can be
            sent straight to the timeline as an event.
          </span>
        )}
      </div>
    </section>
  );
};

export const InterviewsStep = ({ inv, update }) => {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Upsert without closing — used by the editor's autosave.
  const autosave = (item) =>
    update((c) => {
      const exists = c.interviews.some((i) => i.id === item.id);
      return {
        ...c,
        interviews: exists
          ? c.interviews.map((i) => (i.id === item.id ? item : i))
          : [...c.interviews, item],
      };
    });

  const save = (item) => {
    autosave(item);
    setEditing(null);
  };

  // A highlighted passage becomes a draft timeline entry — dated to the
  // incident by default, attributed to the interviewee's account.
  const sendToTimeline = (text, interviewee) =>
    update((c) => ({
      ...c,
      timeline: [
        ...c.timeline,
        {
          ...newTimelineEntry(),
          date: c.details.occurredOn || '',
          actor: interviewee ? `${interviewee} (account)` : 'Interview account',
          text,
        },
      ],
    }));

  const saveAsEvidence = (iv) =>
    update((c) => {
      const item = {
        ...newEvidence(c.evidence),
        type: 'Witness account',
        title: `Interview — ${iv.interviewee}`,
        description: iv.keyPoints || iv.notes.freeRecall.slice(0, 240),
        source: `Interview by ${iv.interviewer || 'investigator'}`,
        collectedOn: iv.conductedOn,
      };
      return { ...c, evidence: [...c.evidence, item] };
    });

  const isInEvidence = (iv) =>
    inv.evidence.some((e) => e.title === `Interview — ${iv.interviewee}`);

  if (editing) {
    return (
      <InterviewEditor
        initial={editing}
        onSave={save}
        onAutosave={autosave}
        onCancel={() => setEditing(null)}
        onSendToTimeline={sendToTimeline}
      />
    );
  }

  return (
    <section className="rise">
      <SectionHeader
        title="Interviews"
        sub="Structured cognitive interviews — rapport first, free recall uninterrupted, then open questions. Learning, not blame."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing(newInterview())}>
            New interview
          </Button>
        }
      />

      {inv.interviews.length === 0 ? (
        <EmptyState
          icon="mic"
          title="No interviews yet"
          hint="Interview people while memories are fresh — ideally within 24–48 hours, before accounts converge."
          action={
            <Button variant="primary" icon="plus" onClick={() => setEditing(newInterview())}>
              Record first interview
            </Button>
          }
        />
      ) : (
        <div className="iv-list">
          {inv.interviews.map((iv) => (
            <div key={iv.id} className="iv-card">
              <div className="iv-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="iv-name">{iv.interviewee}</span>
                  {iv.role && (
                    <span className="muted" style={{ fontSize: 12.5, marginLeft: 8 }}>
                      {iv.role}
                    </span>
                  )}
                </div>
                {iv.conductedOn && (
                  <span className="muted mono" style={{ fontSize: 11 }}>
                    {fmtDate(iv.conductedOn)}
                  </span>
                )}
                {iv.notes.freeRecall.trim() ? (
                  <Tag tone="ok">Recorded</Tag>
                ) : (
                  <Tag>Draft</Tag>
                )}
                <IconButton icon="pencil" label="Edit" onClick={() => setEditing(iv)} />
                <IconButton
                  icon="trash"
                  label="Delete"
                  danger
                  onClick={() => setToDelete(iv)}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 8,
                  fontSize: 12,
                  color: 'var(--ink-3)',
                }}
              >
                {iv.interviewer && <span>Interviewer: {iv.interviewer}</span>}
                <span>
                  {iv.questions.filter((q) => q.question.trim() || q.answer.trim()).length}{' '}
                  question
                  {iv.questions.filter((q) => q.question.trim() || q.answer.trim()).length === 1
                    ? ''
                    : 's'}{' '}
                  recorded
                </span>
                {iv.keyPoints.trim() && <span>Key points noted</span>}
                <span style={{ marginLeft: 'auto', display: 'flex' }}>
                  <Button
                    size="sm"
                    icon="link"
                    disabled={isInEvidence(iv)}
                    onClick={() => saveAsEvidence(iv)}
                  >
                    {isInEvidence(iv) ? 'In evidence log' : 'Add to evidence log'}
                  </Button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete interview"
          message={`Delete the interview with ${toDelete.interviewee}?`}
          onConfirm={() => {
            update((c) => ({
              ...c,
              interviews: c.interviews.filter((i) => i.id !== toDelete.id),
            }));
          }}
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
};
