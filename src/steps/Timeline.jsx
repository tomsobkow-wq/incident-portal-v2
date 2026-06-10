import { useState } from 'react';
import { fmtDate, newTimelineEntry } from '../lib/model.js';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  EvidenceChips,
  EvidencePicker,
  Field,
  IconButton,
  Input,
  Modal,
  SectionHeader,
  TextArea,
} from '../components/ui.jsx';

const sortKey = (t) => `${t.date || '9999-99-99'}T${t.time || '99:99'}`;

const TimelineModal = ({ inv, initial, onSave, onClose }) => {
  const [draft, setDraft] = useState(initial);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const valid = draft.text.trim() && draft.date;
  return (
    <Modal
      title={initial.text ? 'Edit timeline entry' : 'Add timeline entry'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(draft)}>
            Save entry
          </Button>
        </>
      }
    >
      <div className="grid-3">
        <Field label="Date">
          <input
            className="input"
            type="date"
            value={draft.date}
            onChange={(e) => set('date')(e.target.value)}
          />
        </Field>
        <Field label="Time">
          <input
            className="input"
            type="time"
            value={draft.time}
            onChange={(e) => set('time')(e.target.value)}
          />
        </Field>
        <Field label="Actor / track">
          <Input
            value={draft.actor}
            onChange={set('actor')}
            placeholder="e.g. Operator, Control room"
          />
        </Field>
      </div>
      <Field
        label="What happened at this point"
        hint="Two entries with the same date and time appear side by side as parallel events — use Actor/track to say who or what each strand belongs to."
      >
        <TextArea
          value={draft.text}
          onChange={set('text')}
          rows={3}
          placeholder="One event per entry — factual, specific, time-anchored."
        />
      </Field>
      <Field label="Supporting evidence">
        <EvidencePicker inv={inv} value={draft.evidenceIds} onChange={set('evidenceIds')} />
      </Field>
    </Modal>
  );
};

export const TimelineStep = ({ inv, update }) => {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const entries = [...inv.timeline].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  // Entries sharing the same date+time form one moment with parallel strands.
  // Untimed entries never merge — without a time, "parallel" can't be claimed.
  const moments = [];
  for (const t of entries) {
    const key = t.time ? `${t.date}|${t.time}` : `solo|${t.id}`;
    const last = moments[moments.length - 1];
    if (last && last.key === key) last.items.push(t);
    else moments.push({ key, date: t.date, time: t.time, items: [t] });
  }

  const save = (item) => {
    update((c) => {
      const exists = c.timeline.some((t) => t.id === item.id);
      return {
        ...c,
        timeline: exists
          ? c.timeline.map((t) => (t.id === item.id ? item : t))
          : [...c.timeline, item],
      };
    });
    setEditing(null);
  };

  return (
    <section className="rise">
      <SectionHeader
        title="Timeline"
        sub="Reconstruct the sequence of events. Entries with the same time sit side by side as parallel strands — anchor each to evidence."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing(newTimelineEntry())}>
            Add entry
          </Button>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon="clock"
          title="No timeline yet"
          hint="Start with the incident itself, then work backwards and forwards — entries sort themselves chronologically."
          action={
            <Button variant="primary" icon="plus" onClick={() => setEditing(newTimelineEntry())}>
              Add first entry
            </Button>
          }
        />
      ) : (
        <div className="tl">
          {moments.map((m) => (
            <div key={m.key + m.items[0].id} className="tl-entry">
              <div className="tl-when">
                <div className="tl-time">{m.time || '—'}</div>
                <div className="tl-date">{fmtDate(m.date)}</div>
              </div>
              <div className="tl-axis">
                <div className="tl-dot" />
              </div>
              <div className="tl-parallel">
                {m.items.map((t) => (
                  <div key={t.id} className="tl-body">
                    {m.items.length > 1 && (
                      <div className="tl-parallel-tag">In parallel</div>
                    )}
                    {t.actor && <div className="tl-actor">{t.actor}</div>}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div className="tl-text" style={{ flex: 1 }}>
                        {t.text}
                      </div>
                      <IconButton icon="pencil" label="Edit" onClick={() => setEditing(t)} />
                      <IconButton
                        icon="trash"
                        label="Delete"
                        danger
                        onClick={() => setToDelete(t)}
                      />
                    </div>
                    {t.evidenceIds.length > 0 && (
                      <div className="tl-extra">
                        <EvidenceChips inv={inv} ids={t.evidenceIds} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TimelineModal
          inv={inv}
          initial={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete timeline entry"
          message="Delete this entry from the timeline?"
          onConfirm={() =>
            update((c) => ({
              ...c,
              timeline: c.timeline.filter((t) => t.id !== toDelete.id),
            }))
          }
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
};
