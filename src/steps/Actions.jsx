import { useState } from 'react';
import {
  ACTION_HIERARCHY,
  ACTION_STATUS,
  allIcamFactors,
  fmtDate,
  ICAM_KINDS,
  isOverdue,
  newAction,
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
  Select,
  Tag,
  TextArea,
} from '../components/ui.jsx';

const STATUS_TONE = {
  Proposed: '',
  Approved: 'steel',
  'In progress': 'warn',
  Complete: 'ok',
};


const ActionModal = ({ inv, initial, onSave, onClose }) => {
  const [draft, setDraft] = useState(initial);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const factors = allIcamFactors(inv).filter((f) => f.text.trim());
  const toggleFactor = (id) =>
    set('factorIds')(
      draft.factorIds.includes(id)
        ? draft.factorIds.filter((x) => x !== id)
        : [...draft.factorIds, id]
    );
  return (
    <Modal
      title={initial.title ? 'Edit action' : 'New corrective action'}
      onClose={onClose}
      width={620}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!draft.title.trim()}
            onClick={() => onSave(draft)}
          >
            Save action
          </Button>
        </>
      }
    >
      <Field label="Action">
        <Input
          value={draft.title}
          onChange={set('title')}
          placeholder="What will be done — specific and verifiable"
        />
      </Field>
      <Field label="Detail">
        <TextArea value={draft.detail} onChange={set('detail')} rows={2} />
      </Field>
      <div className="grid-3">
        <Field label="Owner">
          <Input value={draft.owner} onChange={set('owner')} placeholder="Name / role" />
        </Field>
        <Field label="Due">
          <input
            className="input"
            type="date"
            value={draft.due}
            onChange={(e) => set('due')(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select value={draft.status} onChange={set('status')} options={ACTION_STATUS} />
        </Field>
      </div>
      <Field
        label="Hierarchy of control"
        hint="Prefer the top of the hierarchy — elimination beats PPE."
      >
        <Select
          value={draft.hierarchy}
          onChange={set('hierarchy')}
          options={ACTION_HIERARCHY}
          placeholder="Select…"
        />
      </Field>
      {factors.length > 0 && (
        <Field
          label="Addresses contributing factors"
          hint="Every organisational factor should end up with at least one action."
        >
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            {factors.map((f) => (
              <label
                key={f.id}
                style={{
                  display: 'flex',
                  gap: 9,
                  alignItems: 'baseline',
                  padding: '7px 11px',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={draft.factorIds.includes(f.id)}
                  onChange={() => toggleFactor(f.id)}
                />
                <span
                  className="mono"
                  style={{ fontWeight: 600, fontSize: 10.5, color: ICAM_KINDS[f.kind].color }}
                >
                  {ICAM_KINDS[f.kind].short}
                </span>
                <span>{f.text}</span>
              </label>
            ))}
          </div>
        </Field>
      )}
    </Modal>
  );
};

export const ActionsStep = ({ inv, update }) => {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const factors = allIcamFactors(inv);
  const factorById = (id) => factors.find((f) => f.id === id);
  const unaddressedOf = inv.icam.of.filter(
    (f) => f.text.trim() && !inv.actions.some((a) => a.factorIds.includes(f.id))
  );

  const save = (item) => {
    update((c) => {
      const exists = c.actions.some((a) => a.id === item.id);
      return {
        ...c,
        actions: exists
          ? c.actions.map((a) => (a.id === item.id ? item : a))
          : [...c.actions, item],
      };
    });
    setEditing(null);
  };

  return (
    <section className="rise">
      <SectionHeader
        title="Corrective actions"
        sub="Actions should address the organisational factors — not just the person. Aim high on the hierarchy of control."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing(newAction())}>
            New action
          </Button>
        }
      />

      {unaddressedOf.length > 0 && inv.actions.length > 0 && (
        <div
          className="card pad"
          style={{ marginBottom: 14, borderColor: 'var(--warn)', background: 'var(--warn-tint)' }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)' }}>
            {unaddressedOf.length} organisational factor{unaddressedOf.length > 1 ? 's' : ''} without
            a corrective action
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 3 }}>
            {unaddressedOf.map((f) => f.text).join(' · ')}
          </div>
        </div>
      )}

      {inv.actions.length === 0 ? (
        <EmptyState
          icon="check"
          title="No actions yet"
          hint="Turn each contributing factor — especially the organisational ones — into a specific, owned, dated action."
          action={
            <Button variant="primary" icon="plus" onClick={() => setEditing(newAction())}>
              Add first action
            </Button>
          }
        />
      ) : (
        <div className="ev-list">
          {inv.actions.map((a) => (
            <div key={a.id} className={`action-row ${a.status === 'Complete' ? 'done' : ''}`}>
              <div className="a-main">
                <div className="a-title">{a.title}</div>
                {a.detail && <div className="a-detail">{a.detail}</div>}
                <div className="a-meta">
                  <Tag tone={STATUS_TONE[a.status]}>{a.status}</Tag>
                  {isOverdue(a) && <Tag tone="accent">Overdue</Tag>}
                  {a.hierarchy && <Tag tone="steel">{a.hierarchy}</Tag>}
                  {a.owner && <span>{a.owner}</span>}
                  {a.due && <span>Due {fmtDate(a.due)}</span>}
                  {a.factorIds.map((id) => {
                    const f = factorById(id);
                    return f ? (
                      <span key={id} className="chip" title={f.text}>
                        <span className="ref" style={{ color: ICAM_KINDS[f.kind].color }}>
                          {ICAM_KINDS[f.kind].short}
                        </span>
                        <span className="t">{f.text}</span>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="e-actions">
                <IconButton icon="pencil" label="Edit" onClick={() => setEditing(a)} />
                <IconButton icon="trash" label="Delete" danger onClick={() => setToDelete(a)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ActionModal inv={inv} initial={editing} onSave={save} onClose={() => setEditing(null)} />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete action"
          message={`Delete “${toDelete.title}”?`}
          onConfirm={() =>
            update((c) => ({ ...c, actions: c.actions.filter((a) => a.id !== toDelete.id) }))
          }
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
};
