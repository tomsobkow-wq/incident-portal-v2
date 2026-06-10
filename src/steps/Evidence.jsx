import { useState } from 'react';
import { EVIDENCE_TYPES, fmtDate, newEvidence } from '../lib/model.js';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Icon,
  IconButton,
  Input,
  Modal,
  SectionHeader,
  Select,
  TextArea,
} from '../components/ui.jsx';

const TYPE_ICON = {
  Photo: 'camera',
  Document: 'doc',
  'Witness account': 'mic',
  Physical: 'box',
  'Data / records': 'data',
};

const EvidenceModal = ({ initial, onSave, onClose }) => {
  const [draft, setDraft] = useState(initial);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const valid = draft.title.trim();
  return (
    <Modal
      title={`${initial.title ? 'Edit' : 'Add'} evidence — ${draft.ref}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(draft)}>
            Save evidence
          </Button>
        </>
      }
    >
      <div className="grid-2">
        <Field label="Type">
          <Select value={draft.type} onChange={set('type')} options={EVIDENCE_TYPES} />
        </Field>
        <Field label="Collected on">
          <input
            className="input"
            type="date"
            value={draft.collectedOn}
            onChange={(e) => set('collectedOn')(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Title">
        <Input
          value={draft.title}
          onChange={set('title')}
          placeholder="e.g. CCTV still — loading dock, 14:32"
        />
      </Field>
      <Field label="Description / key content">
        <TextArea
          value={draft.description}
          onChange={set('description')}
          rows={3}
          placeholder="What does this evidence show or establish?"
        />
      </Field>
      <Field
        label="Source / custody"
        hint="Where it came from and where the original is held."
      >
        <Input
          value={draft.source}
          onChange={set('source')}
          placeholder="e.g. Site CCTV server, exported by J. Smith"
        />
      </Field>
    </Modal>
  );
};

export const EvidenceStep = ({ inv, update }) => {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const save = (item) => {
    update((c) => {
      const exists = c.evidence.some((e) => e.id === item.id);
      return {
        ...c,
        evidence: exists
          ? c.evidence.map((e) => (e.id === item.id ? item : e))
          : [...c.evidence, item],
      };
    });
    setEditing(null);
  };

  const remove = (id) =>
    update((c) => ({
      ...c,
      evidence: c.evidence.filter((e) => e.id !== id),
      // drop dangling links everywhere
      timeline: c.timeline.map((t) => ({
        ...t,
        evidenceIds: t.evidenceIds.filter((x) => x !== id),
      })),
      fiveWhys: {
        ...c.fiveWhys,
        whys: c.fiveWhys.whys.map((w) => ({
          ...w,
          evidenceIds: w.evidenceIds.filter((x) => x !== id),
        })),
      },
      icam: Object.fromEntries(
        Object.entries(c.icam).map(([k, list]) => [
          k,
          list.map((f) => ({
            ...f,
            evidenceIds: f.evidenceIds.filter((x) => x !== id),
          })),
        ])
      ),
    }));

  return (
    <section className="rise">
      <SectionHeader
        title="Evidence"
        sub="Log every item before it degrades or disappears — photos, documents, witness accounts, physical items, data. Later steps link back to these references."
        actions={
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setEditing(newEvidence(inv.evidence))}
          >
            Add evidence
          </Button>
        }
      />

      {inv.evidence.length === 0 ? (
        <EmptyState
          icon="camera"
          title="No evidence logged"
          hint="Start with whatever is most perishable — CCTV footage, the scene itself, first witness accounts."
          action={
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setEditing(newEvidence(inv.evidence))}
            >
              Add first item
            </Button>
          }
        />
      ) : (
        <div className="ev-list">
          {inv.evidence.map((e) => (
            <div key={e.id} className="ev-row">
              <div className="e-icon">
                <Icon name={TYPE_ICON[e.type] || 'doc'} size={15} />
              </div>
              <div className="e-main">
                <div className="e-title">{e.title}</div>
                {e.description && <div className="e-desc">{e.description}</div>}
                <div className="e-meta">
                  <span className="mono" style={{ color: 'var(--steel)', fontWeight: 600 }}>
                    {e.ref}
                  </span>
                  <span>{e.type}</span>
                  {e.collectedOn && <span>Collected {fmtDate(e.collectedOn)}</span>}
                  {e.source && <span>{e.source}</span>}
                </div>
              </div>
              <div className="e-actions">
                <IconButton icon="pencil" label="Edit" onClick={() => setEditing(e)} />
                <IconButton
                  icon="trash"
                  label="Delete"
                  danger
                  onClick={() => setToDelete(e)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EvidenceModal
          initial={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete evidence"
          message={`Delete ${toDelete.ref} — “${toDelete.title}”? Links to it from other steps will be removed.`}
          onConfirm={() => remove(toDelete.id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
};
