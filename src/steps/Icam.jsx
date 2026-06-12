import { useState } from 'react';
import {
  ICAM_KINDS,
  ICAM_ORDER,
  newHfatEntry,
  newIcamFactor,
  newPeepoItem,
  PEEPO_CATEGORIES,
  PEEPO_STATUS,
} from '../lib/model.js';
import {
  Button,
  ConfirmDialog,
  EvidenceChips,
  EvidencePicker,
  Field,
  HelpTip,
  Icon,
  IconButton,
  Modal,
  SectionHeader,
  Select,
  Tag,
  TextArea,
} from '../components/ui.jsx';
import { ContributionDialog } from '../components/ContributionDialog.jsx';
import { useCases } from '../App.jsx';

const PeepoModal = ({ inv, initial, onSave, onDelete, onTransfer, onClose }) => {
  const [draft, setDraft] = useState(initial);
  const [confirming, setConfirming] = useState(false);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const isNew = !inv.peepo.some((p) => p.id === initial.id);
  const transferred =
    draft.factorId &&
    Object.values(inv.icam).some((list) => list.some((f) => f.id === draft.factorId));
  return (
    <Modal
      title={`PEEPO — ${draft.category}`}
      onClose={onClose}
      width={780}
      footer={
        <>
          {!isNew && (
            <span className="left">
              <Button variant="danger" icon="trash" onClick={() => onDelete(draft.id)}>
                Delete
              </Button>
            </span>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!draft.text.trim()}
            onClick={() => onSave(draft)}
          >
            Save
          </Button>
        </>
      }
    >
      <Field
        label="Line of enquiry"
        hint="An idea to explore, a question to answer, or a condition to check."
      >
        <TextArea
          value={draft.text}
          onChange={set('text')}
          rows={4}
          placeholder="e.g. Was the traffic plan reviewed after the racking change?"
        />
      </Field>
      <div className="grid-2">
        <Field label="Category">
          <Select
            value={draft.category}
            onChange={set('category')}
            options={PEEPO_CATEGORIES.map((c) => c.key)}
          />
        </Field>
        <Field label="Status">
          <Select value={draft.status} onChange={set('status')} options={PEEPO_STATUS} />
        </Field>
      </div>
      <Field
        label="Evidence"
        hint="Link the evidence this line of enquiry produced or relies on."
      >
        <EvidencePicker inv={inv} value={draft.evidenceIds} onChange={set('evidenceIds')} />
      </Field>
      <Field label="What was found">
        <TextArea
          value={draft.notes}
          onChange={set('notes')}
          rows={5}
          placeholder="Outcome of exploring this — feeds the factor analysis below."
        />
      </Field>
      <Field
        label="Transfer to the ICAM factor table"
        hint="Findings only become contributing factors after passing the contribution test — you'll be asked to confirm."
      >
        {transferred ? (
          <div>
            <Tag tone="ok">In the ICAM factor table</Tag>
          </div>
        ) : (
          <div>
            <Button
              variant="subtle"
              disabled={!(draft.notes.trim() || draft.text.trim())}
              onClick={() => setConfirming(true)}
            >
              <Icon name="link" size={12} />
              Apply the contribution test…
            </Button>
          </div>
        )}
      </Field>
      {confirming && (
        <ContributionDialog
          text={draft.notes.trim() || draft.text.trim()}
          onConfirm={(kind) => {
            setConfirming(false);
            onTransfer(draft, kind);
          }}
          onClose={() => setConfirming(false)}
        />
      )}
    </Modal>
  );
};

const FactorModal = ({ inv, initial, onSave, onClose }) => {
  const [draft, setDraft] = useState(initial);
  const kind = ICAM_KINDS[draft.kind];
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <Modal
      title={`${initial.text ? 'Edit' : 'Add'} — ${kind.label}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!draft.text.trim()}
            onClick={() => onSave(draft)}
          >
            Save factor
          </Button>
        </>
      }
    >
      <Field label="Factor" hint={kind.hint}>
        <TextArea
          value={draft.text}
          onChange={set('text')}
          rows={3}
          placeholder="Describe the contributing factor…"
        />
      </Field>
      <Field label={kind.ratingLabel}>
        <Select
          value={draft.rating}
          onChange={set('rating')}
          options={kind.ratings}
          placeholder="Select…"
        />
      </Field>
      <Field label="Supporting evidence">
        <EvidencePicker inv={inv} value={draft.evidenceIds} onChange={set('evidenceIds')} />
      </Field>
      <Field label="Notes">
        <TextArea value={draft.notes} onChange={set('notes')} rows={2} />
      </Field>
    </Modal>
  );
};

const ARROW_LABELS = {
  of: 'create the conditions for…',
  tec: 'which promote…',
  ita: 'which breach or bypass…',
  afd: '…and the incident occurs',
};

export const IcamStep = ({ inv, update }) => {
  const { goStep } = useCases();
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [peepoEditing, setPeepoEditing] = useState(null);

  const savePeepo = (item) => {
    update((c) => {
      const exists = c.peepo.some((p) => p.id === item.id);
      return {
        ...c,
        peepo: exists
          ? c.peepo.map((p) => (p.id === item.id ? item : p))
          : [...c.peepo, item],
      };
    });
    setPeepoEditing(null);
  };
  const deletePeepo = (id) => {
    update((c) => ({ ...c, peepo: c.peepo.filter((p) => p.id !== id) }));
    setPeepoEditing(null);
  };

  // A PEEPO finding that passes the contribution test becomes an ICAM factor,
  // carrying its evidence links with it.
  const transferPeepo = (item, kind) => {
    const factor = {
      ...newIcamFactor(kind),
      text: item.notes.trim() || item.text.trim(),
      evidenceIds: [...item.evidenceIds],
      notes: `From PEEPO (${item.category}): ${item.text}`,
    };
    const updated = { ...item, status: 'Explored', factorId: factor.id };
    update((c) => ({
      ...c,
      icam: { ...c.icam, [kind]: [...c.icam[kind], factor] },
      peepo: c.peepo.some((p) => p.id === item.id)
        ? c.peepo.map((p) => (p.id === item.id ? updated : p))
        : [...c.peepo, updated],
    }));
    setPeepoEditing(null);
  };

  const save = (item) => {
    update((c) => {
      const list = c.icam[item.kind];
      const exists = list.some((f) => f.id === item.id);
      return {
        ...c,
        icam: {
          ...c.icam,
          [item.kind]: exists
            ? list.map((f) => (f.id === item.id ? item : f))
            : [...list, item],
        },
      };
    });
    setEditing(null);
  };

  const remove = (factor) =>
    update((c) => ({
      ...c,
      icam: {
        ...c.icam,
        [factor.kind]: c.icam[factor.kind].filter((f) => f.id !== factor.id),
      },
      hfat: c.hfat.map((h) => (h.itaId === factor.id ? { ...h, itaId: '' } : h)),
      actions: c.actions.map((a) => ({
        ...a,
        factorIds: a.factorIds.filter((x) => x !== factor.id),
      })),
      peepo: c.peepo.map((p) =>
        p.factorId === factor.id ? { ...p, factorId: '' } : p
      ),
    }));

  const analyseInHfat = (factor) => {
    const existing = inv.hfat.find((h) => h.itaId === factor.id);
    if (!existing) {
      update((c) => ({
        ...c,
        hfat: [
          ...c.hfat,
          {
            ...newHfatEntry(),
            itaId: factor.id,
            actionError: {
              type: factor.rating || '',
              actor: '',
              description: factor.text,
            },
          },
        ],
      }));
    }
    goStep('hfat');
  };

  return (
    <section className="rise">
      <SectionHeader
        title="ICAM analysis"
        sub="Brainstorm lines of enquiry with PEEPO, then map contributing factors along the causal chain: organisational factors create task conditions, which promote individual actions, which breach defences."
      />

      <div className="peepo-board">
        <div className="peepo-head">
          <div style={{ flex: 1 }}>
            <div className="p-title">PEEPO brainstorm</div>
            <div className="p-hint">
              Ideas to explore and where the evidence sits — amber items still need
              exploring, green are done. Findings that pass the contribution test
              transfer to the factor table below; the rest stay here as context.
            </div>
          </div>
        </div>
        <div className="peepo-grid">
          {PEEPO_CATEGORIES.map((cat) => (
            <div key={cat.key} className="peepo-col">
              <div className="pc-name" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {cat.key}
                <HelpTip title={cat.key} lines={cat.help} />
              </div>
              {inv.peepo
                .filter((p) => p.category === cat.key)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`peepo-item ${p.status === 'Explored' ? 'explored' : 'to-explore'}`}
                    onClick={() => setPeepoEditing(p)}
                  >
                    <span className="pi-text">{p.text}</span>
                    <span className="pi-meta">
                      {p.status === 'To explore' && <Tag tone="warn">To explore</Tag>}
                      {p.factorId && <Tag tone="steel">In ICAM</Tag>}
                      <EvidenceChips inv={inv} ids={p.evidenceIds} />
                    </span>
                  </button>
                ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPeepoEditing(newPeepoItem(cat.key))}
                style={{ alignSelf: 'flex-start' }}
              >
                <Icon name="plus" size={11} />
                Add
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="icam-flow">
        {ICAM_ORDER.map((kindKey, i) => {
          const kind = ICAM_KINDS[kindKey];
          const factors = inv.icam[kindKey];
          return (
            <div key={kindKey}>
              {i > 0 && <div className="icam-arrow">{ARROW_LABELS[ICAM_ORDER[i - 1]]}</div>}
              <div className="icam-band">
                <div
                  className="band-head"
                  style={{ background: `color-mix(in srgb, ${kind.color} 8%, #fff)` }}
                >
                  <span className="b-bar" style={{ background: kind.color }} />
                  <div style={{ flex: 1 }}>
                    <div
                      className="b-label"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, color: kind.color }}
                    >
                      {kind.label}
                      <HelpTip title={kind.label} lines={kind.help} />
                    </div>
                    <div className="b-hint">{kind.hint}</div>
                  </div>
                  <Button
                    size="sm"
                    icon="plus"
                    onClick={() => setEditing(newIcamFactor(kindKey))}
                  >
                    Add
                  </Button>
                </div>
                <div className="band-body">
                  {factors.length === 0 ? (
                    <div className="hint" style={{ padding: '4px 6px' }}>
                      No {kind.label.toLowerCase()} identified yet.
                    </div>
                  ) : (
                    factors.map((f) => {
                      const nActions = inv.actions.filter((a) =>
                        a.factorIds.includes(f.id)
                      ).length;
                      return (
                      <div key={f.id} className="factor-card">
                        <div className="f-main">
                          <div className="f-text">{f.text}</div>
                          <div className="f-meta">
                            {f.rating && <Tag tone="steel">{f.rating}</Tag>}
                            <EvidenceChips inv={inv} ids={f.evidenceIds} />
                            {f.evidenceIds.length === 0 && (
                              <Tag tone="warn">No evidence linked yet</Tag>
                            )}
                            {nActions > 0 && (
                              <Tag>
                                Addressed by {nActions} action{nActions > 1 ? 's' : ''}
                              </Tag>
                            )}
                            {kindKey === 'ita' && (
                              <Button size="sm" variant="ghost" onClick={() => analyseInHfat(f)}>
                                {inv.hfat.some((h) => h.itaId === f.id)
                                  ? 'View mini-HFAT →'
                                  : 'Analyse in mini-HFAT →'}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="f-actions">
                          <IconButton icon="pencil" label="Edit" onClick={() => setEditing(f)} />
                          <IconButton
                            icon="trash"
                            label="Delete"
                            danger
                            onClick={() => setToDelete(f)}
                          />
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div className="icam-arrow">{ARROW_LABELS.afd}</div>
      </div>

      {peepoEditing && (
        <PeepoModal
          inv={inv}
          initial={peepoEditing}
          onSave={savePeepo}
          onDelete={deletePeepo}
          onTransfer={transferPeepo}
          onClose={() => setPeepoEditing(null)}
        />
      )}
      {editing && (
        <FactorModal
          inv={inv}
          initial={editing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete factor"
          message="Delete this contributing factor? Links from actions and mini-HFAT will be removed."
          onConfirm={() => remove(toDelete)}
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
};
