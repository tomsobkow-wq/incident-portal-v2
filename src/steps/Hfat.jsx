import { useState } from 'react';
import {
  HFAT_CONDITIONS,
  HFAT_ERROR_TYPES,
  HFAT_FINDINGS,
  newHfatEntry,
  uid,
} from '../lib/model.js';
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  SectionHeader,
  Select,
  Tag,
  TextArea,
} from '../components/ui.jsx';

const HfatCard = ({ inv, entry, onChange, onDelete }) => {
  const set = (patch) => onChange({ ...entry, ...patch });
  const setAE = (key) => (v) =>
    set({ actionError: { ...entry.actionError, [key]: v } });
  const setRec = (key) => (v) => set({ recovery: { ...entry.recovery, [key]: v } });
  const setCog = (stage, patch) =>
    set({
      cognition: entry.cognition.map((c) =>
        c.stage === stage ? { ...c, ...patch } : c
      ),
    });

  const ita = inv.icam.ita.find((f) => f.id === entry.itaId);
  const itaOptions = inv.icam.ita.map((f) => f.text).filter(Boolean);

  const addCondition = () =>
    set({
      conditions: [
        ...entry.conditions,
        { id: uid(), condition: HFAT_CONDITIONS[0], note: '' },
      ],
    });
  const setCondition = (id, patch) =>
    set({
      conditions: entry.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  const removeCondition = (id) =>
    set({ conditions: entry.conditions.filter((c) => c.id !== id) });

  return (
    <div className="hfat-card">
      <div className="h-head">
        <div className="h-title">
          {entry.actionError.description || entry.actionError.type || 'New analysis'}
        </div>
        {ita && <Tag tone="warn">Linked to ICAM action</Tag>}
        <IconButton icon="trash" label="Delete analysis" danger onClick={onDelete} />
      </div>

      <div className="hfat-sec">
        <div className="hs-label">① Action error</div>
        <div className="grid-3">
          <Field label="Linked individual/team action">
            <Select
              value={ita ? ita.text : ''}
              onChange={(text) =>
                set({ itaId: inv.icam.ita.find((f) => f.text === text)?.id || '' })
              }
              options={itaOptions}
              placeholder={
                itaOptions.length
                  ? 'Select individual/team action…'
                  : 'No individual/team actions yet'
              }
            />
          </Field>
          <Field label="Error type">
            <Select
              value={entry.actionError.type}
              onChange={setAE('type')}
              options={HFAT_ERROR_TYPES}
              placeholder="Select…"
            />
          </Field>
          <Field label="Actor">
            <Input
              value={entry.actionError.actor}
              onChange={setAE('actor')}
              placeholder="Role, not name — e.g. operator"
            />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="What was done (or not done)">
            <TextArea
              value={entry.actionError.description}
              onChange={setAE('description')}
              rows={2}
            />
          </Field>
        </div>
      </div>

      <div className="hfat-sec">
        <div className="hs-label">② Error recovery</div>
        <div className="grid-3">
          <Field label="Recovery opportunity" hint="Could the error have been caught in time?">
            <TextArea value={entry.recovery.opportunity} onChange={setRec('opportunity')} rows={2} />
          </Field>
          <Field label="Barrier involved" hint="Check, alarm, supervision, second pair of eyes…">
            <TextArea value={entry.recovery.barrier} onChange={setRec('barrier')} rows={2} />
          </Field>
          <Field label="Outcome" hint="Why recovery did or didn't happen.">
            <TextArea value={entry.recovery.outcome} onChange={setRec('outcome')} rows={2} />
          </Field>
        </div>
      </div>

      <div className="hfat-sec">
        <div className="hs-label">③ Cognitive stage breakdown</div>
        <div className="cog-grid">
          {entry.cognition.map((c) => (
            <div key={c.stage} className={`cog-cell ${c.finding.toLowerCase()}`}>
              <div className="c-stage">{c.stage}</div>
              <Select
                value={c.finding}
                onChange={(v) => setCog(c.stage, { finding: v })}
                options={HFAT_FINDINGS}
                placeholder="Rate…"
                style={{ margin: '6px 0', fontSize: 12.5, padding: '5px 28px 5px 8px' }}
                aria-label={`${c.stage} finding`}
              />
              <TextArea
                value={c.note}
                onChange={(v) => setCog(c.stage, { note: v })}
                rows={2}
                placeholder="Note…"
                style={{ fontSize: 12, minHeight: 48 }}
                aria-label={`${c.stage} note`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hfat-sec">
        <div className="hs-label">④ Performance-shaping conditions</div>
        {entry.conditions.length === 0 && (
          <div className="hint" style={{ marginBottom: 8 }}>
            What made the error more likely? Add the conditions that were present.
          </div>
        )}
        {entry.conditions.map((c) => (
          <div key={c.id} className="psc-row">
            <Select
              value={c.condition}
              onChange={(v) => setCondition(c.id, { condition: v })}
              options={HFAT_CONDITIONS}
              aria-label="Condition"
            />
            <Input
              value={c.note}
              onChange={(v) => setCondition(c.id, { note: v })}
              placeholder="How it contributed…"
              aria-label="Condition note"
            />
            <IconButton
              icon="trash"
              label="Remove condition"
              danger
              onClick={() => removeCondition(c.id)}
            />
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <Button size="sm" icon="plus" onClick={addCondition}>
            Add condition
          </Button>
        </div>
      </div>

      <div className="hfat-sec">
        <div className="hs-label">Summary</div>
        <TextArea
          value={entry.summary}
          onChange={(v) => set({ summary: v })}
          rows={2}
          placeholder="Human-factors conclusion for this action — what would make the error less likely or better tolerated?"
        />
      </div>
    </div>
  );
};

export const HfatStep = ({ inv, update }) => {
  const [toDelete, setToDelete] = useState(null);

  const add = () => update((c) => ({ ...c, hfat: [...c.hfat, newHfatEntry()] }));
  const change = (entry) =>
    update((c) => ({
      ...c,
      hfat: c.hfat.map((h) => (h.id === entry.id ? entry : h)),
    }));

  return (
    <section className="rise">
      <SectionHeader
        title="mini-HFAT"
        sub="Human-factors analysis of each key action: the error, the missed recovery, where cognition broke down, and the conditions that shaped performance."
        actions={
          <Button variant="primary" icon="plus" onClick={add}>
            New analysis
          </Button>
        }
      />

      {inv.hfat.length === 0 ? (
        <EmptyState
          icon="box"
          title="No human-factors analyses yet"
          hint="Analyse each significant individual/team action — start from one in the ICAM factor table, or create an analysis here."
          action={
            <Button variant="primary" icon="plus" onClick={add}>
              Start an analysis
            </Button>
          }
        />
      ) : (
        inv.hfat.map((h) => (
          <HfatCard
            key={h.id}
            inv={inv}
            entry={h}
            onChange={change}
            onDelete={() => setToDelete(h)}
          />
        ))
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete analysis"
          message="Delete this mini-HFAT analysis?"
          onConfirm={() =>
            update((c) => ({ ...c, hfat: c.hfat.filter((h) => h.id !== toDelete.id) }))
          }
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
};
