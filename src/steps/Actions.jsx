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
  Icon,
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

// Hierarchy of control, strongest first. Colour is reserved for this scale —
// it is the one thing on the page colour should mean.
const HIER_META = {
  Elimination: {
    color: '#4f7a5b',
    desc: 'Remove the hazard entirely — redesign the task, route or place so it cannot happen.',
  },
  Substitution: {
    color: '#6e7f62',
    desc: 'Swap in something safer — different equipment, material or process.',
  },
  'Engineering control': {
    color: '#44607a',
    desc: 'Keep people and the hazard apart — guards, interlocks, barriers, ventilation.',
  },
  'Administrative control': {
    color: '#b98a1f',
    desc: 'Procedures, training, signage — relies on people doing the right thing every time.',
  },
  PPE: {
    color: '#c06b1c',
    desc: 'Protects one person if everything else fails — the last line, never the first.',
  },
};

const WEAK_CONTROLS = ['Administrative control', 'PPE'];

// Compact row of buttons: 1 (strongest) → 5 (weakest). The chosen level's
// short description appears beneath — one line, not a wall.
const SHORT_LABEL = {
  'Engineering control': 'Engineering',
  'Administrative control': 'Administrative',
};

const HierarchyPicker = ({ value, onChange }) => (
  <div>
    <div className="hier-seg" role="radiogroup" aria-label="Hierarchy of control">
      {ACTION_HIERARCHY.map((h, i) => (
        <button
          key={h}
          type="button"
          role="radio"
          aria-checked={value === h}
          className={`hs-btn ${value === h ? 'on' : ''}`}
          style={
            value === h
              ? { background: HIER_META[h].color, borderColor: HIER_META[h].color }
              : undefined
          }
          title={HIER_META[h].desc}
          onClick={() => onChange(value === h ? '' : h)}
        >
          <span className="hs-rank">{i + 1}</span>
          {SHORT_LABEL[h] || h}
        </button>
      ))}
    </div>
    {value && <div className="hier-desc">{HIER_META[value].desc}</div>}
  </div>
);

// The editor reads in investigative order: what you're fixing, then what
// will be done about it, then how strong the fix is.
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
      width={680}
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
      {factors.length > 0 && (
        <Field
          label="What is this action fixing?"
          hint="Start from the contributing factor — an action that doesn't address one is usually treating a symptom."
        >
          <div className="factor-pick">
            {factors.map((f) => (
              <label key={f.id} className="fp-row">
                <input
                  type="checkbox"
                  checked={draft.factorIds.includes(f.id)}
                  onChange={() => toggleFactor(f.id)}
                />
                <span className="fp-kind">{ICAM_KINDS[f.kind].tag}</span>
                <span className="fp-text">{f.text}</span>
              </label>
            ))}
          </div>
        </Field>
      )}
      <Field label="Action">
        <Input
          value={draft.title}
          onChange={set('title')}
          placeholder="What will be done — specific and verifiable"
        />
      </Field>
      <Field
        label="Hierarchy of control"
        hint="1 is the strongest control, 5 the weakest — only step down when a stronger one isn't practicable."
      >
        <HierarchyPicker value={draft.hierarchy} onChange={set('hierarchy')} />
      </Field>
      {WEAK_CONTROLS.includes(draft.hierarchy) && (
        <div className="control-nudge">
          Could this hazard be eliminated, substituted, or engineered out
          instead? If not, say why in the detail — that reasoning belongs in
          the report.
        </div>
      )}
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
    </Modal>
  );
};

// The bridge from ICAM: every contributing factor, in causal order, with its
// treatment status. This leads the page — actions exist to answer it.
const FactorCoverage = ({ inv, onAddFor }) => {
  const factors = allIcamFactors(inv).filter((f) => f.text.trim());
  if (!factors.length) return null;
  return (
    <div className="factor-coverage">
      <div className="fc-head">
        <div className="fc-title">From the ICAM analysis — what needs fixing</div>
        <div className="fc-sub">
          Give every factor an action, starting at the top: organisational
          fixes prevent recurrence, individual ones rarely do.
        </div>
      </div>
      {factors.map((f) => {
        const acts = inv.actions.filter((a) => a.factorIds.includes(f.id));
        return (
          <div key={f.id} className="fc-row">
            <span className="fc-kind">{ICAM_KINDS[f.kind].tag}</span>
            <span className="fc-text">{f.text}</span>
            {acts.length ? (
              <span className="fc-count">
                <Icon name="check" size={11} />
                {acts.length} action{acts.length > 1 ? 's' : ''}
              </span>
            ) : (
              <Button size="sm" variant="ghost" icon="plus" onClick={() => onAddFor(f)}>
                Add action
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// One glance at the spread of controls — strongest on the left. Clicking a
// segment spotlights its actions in the list below; everything else fades
// into the background. An all-admin/PPE mix earns a gentle note, not an alarm.
const ControlsMix = ({ actions, tier, onTier }) => {
  const classified = actions.filter((a) => a.hierarchy);
  if (!classified.length) return null;
  const counts = ACTION_HIERARCHY.map((h) => ({
    h,
    n: classified.filter((a) => a.hierarchy === h).length,
  }));
  const allWeak = classified.every((a) => WEAK_CONTROLS.includes(a.hierarchy));
  return (
    <div className="controls-mix">
      <div className="cm-head">
        Controls mix
        {tier ? (
          <span className="cm-showing" style={{ color: HIER_META[tier].color }}>
            {' '}— showing {tier.toLowerCase()} actions only
            <button className="cm-clear" onClick={() => onTier('')}>
              show all
            </button>
          </span>
        ) : (
          <span className="muted">
            {' '}— stronger controls sit to the left. Click a bar to spotlight its actions.
          </span>
        )}
      </div>
      <div className="cm-bar">
        {counts.map(
          ({ h, n }) =>
            n > 0 && (
              <button
                key={h}
                type="button"
                className={`cm-seg ${tier === h ? 'on' : ''} ${tier && tier !== h ? 'dim' : ''}`}
                style={{ flex: n, background: HIER_META[h].color }}
                title={`${h}: ${n} action${n > 1 ? 's' : ''}`}
                aria-pressed={tier === h}
                onClick={() => onTier(tier === h ? '' : h)}
              >
                {n}
              </button>
            )
        )}
      </div>
      <div className="cm-legend">
        {counts.map(({ h, n }) => (
          <span key={h} className={n ? '' : 'off'}>
            <i style={{ background: HIER_META[h].color }} />
            {h}
          </span>
        ))}
      </div>
      {allWeak && (
        <div className="cm-note">
          Every action so far relies on administrative controls or PPE — the
          weakest rungs of the ladder. Worth one more pass over the factor
          table for elimination, substitution or engineering opportunities.
        </div>
      )}
    </div>
  );
};

export const ActionsStep = ({ inv, update }) => {
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [tier, setTier] = useState('');

  const factors = allIcamFactors(inv);
  const factorById = (id) => factors.find((f) => f.id === id);

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
        sub="Work from the factor list down: every contributing factor gets an action, aimed as high on the hierarchy of control as practicable."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setEditing(newAction())}>
            New action
          </Button>
        }
      />

      <FactorCoverage
        inv={inv}
        onAddFor={(f) => setEditing({ ...newAction(), factorIds: [f.id] })}
      />

      <ControlsMix actions={inv.actions} tier={tier} onTier={setTier} />

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
            <div
              key={a.id}
              className={`action-row ${a.status === 'Complete' ? 'done' : ''} ${
                tier && a.hierarchy !== tier ? 'backgrounded' : ''
              }`}
            >
              <div className="a-main">
                <div className="a-title">{a.title}</div>
                {a.detail && <div className="a-detail">{a.detail}</div>}
                <div className="a-meta">
                  <Tag tone={STATUS_TONE[a.status]}>{a.status}</Tag>
                  {isOverdue(a) && <Tag tone="accent">Overdue</Tag>}
                  {a.hierarchy && (
                    <span className="hier-pill">
                      <i style={{ background: HIER_META[a.hierarchy]?.color }} />
                      {a.hierarchy}
                    </span>
                  )}
                  {a.owner && <span>{a.owner}</span>}
                  {a.due && <span>Due {fmtDate(a.due)}</span>}
                  {a.factorIds.map((id) => {
                    const f = factorById(id);
                    return f ? (
                      <span
                        key={id}
                        className="chip wide"
                        title={`${ICAM_KINDS[f.kind].tag} — ${f.text}`}
                      >
                        <span className="t">Fixes: {f.text}</span>
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
