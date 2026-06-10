import { useState } from 'react';
import {
  fmtDate,
  INTERVIEW_PHASES,
  newEvidence,
  newInterview,
  newQuestion,
} from '../lib/model.js';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  SectionHeader,
  Tag,
  TextArea,
} from '../components/ui.jsx';

const QAEditor = ({ questions, onChange }) => {
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
            <TextArea
              value={q.answer}
              onChange={(v) => setQ(q.id, { answer: v })}
              rows={4}
              placeholder="Their response, as close to verbatim as possible"
              aria-label={`Response ${i + 1}`}
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

const InterviewModal = ({ initial, onSave, onClose }) => {
  const [draft, setDraft] = useState(initial);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const setNote = (key) => (value) =>
    setDraft((d) => ({ ...d, notes: { ...d.notes, [key]: value } }));
  const valid = draft.interviewee.trim();

  return (
    <Modal
      title={initial.interviewee ? `Interview — ${initial.interviewee}` : 'New interview'}
      onClose={onClose}
      width={960}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(draft)}>
            Save interview
          </Button>
        </>
      }
    >
      <div className="grid-2">
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
        hint="The five phases below follow cognitive-interview practice: build rapport, get an uninterrupted free-recall account, then probe with open questions only."
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
                  />
                </div>
              ) : (
                <TextArea
                  value={draft.notes[p.key]}
                  onChange={setNote(p.key)}
                  rows={p.key === 'freeRecall' ? 10 : 3}
                  placeholder={p.key === 'freeRecall' ? 'Their account, in their words…' : ''}
                  aria-label={p.label}
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
        <TextArea
          value={draft.keyPoints}
          onChange={set('keyPoints')}
          rows={3}
          placeholder="One point per line…"
        />
      </Field>
    </Modal>
  );
};

export const InterviewsStep = ({ inv, update }) => {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const save = (item) => {
    update((c) => {
      const exists = c.interviews.some((i) => i.id === item.id);
      return {
        ...c,
        interviews: exists
          ? c.interviews.map((i) => (i.id === item.id ? item : i))
          : [...c.interviews, item],
      };
    });
    setEditing(null);
  };

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
              {iv.questions.filter((q) => q.question.trim() || q.answer.trim()).length > 0 && (
                <div className="qa-display" style={{ marginTop: 10 }}>
                  {iv.questions
                    .filter((q) => q.question.trim() || q.answer.trim())
                    .map((q) => (
                      <div key={q.id}>
                        <div className="q">Q · {q.question || '—'}</div>
                        <div className="a">{q.answer || 'No response recorded.'}</div>
                      </div>
                    ))}
                </div>
              )}
              {iv.keyPoints && <div className="iv-points">{iv.keyPoints}</div>}
              <div style={{ marginTop: 10 }}>
                <Button
                  size="sm"
                  icon="link"
                  disabled={isInEvidence(iv)}
                  onClick={() => saveAsEvidence(iv)}
                >
                  {isInEvidence(iv) ? 'In evidence log' : 'Add to evidence log'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <InterviewModal initial={editing} onSave={save} onClose={() => setEditing(null)} />
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
