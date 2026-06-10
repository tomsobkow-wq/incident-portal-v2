import { newIcamFactor, newWhy } from '../lib/model.js';
import {
  Button,
  EvidencePicker,
  Icon,
  IconButton,
  SectionHeader,
  TextArea,
} from '../components/ui.jsx';
import { useCases } from '../App.jsx';

const MAX_WHYS = 7;

export const FiveWhysStep = ({ inv, update }) => {
  const { goStep } = useCases();
  const fw = inv.fiveWhys;

  const setFw = (patch) =>
    update((c) => ({ ...c, fiveWhys: { ...c.fiveWhys, ...patch } }));
  const setWhy = (id, patch) =>
    setFw({
      whys: fw.whys.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });
  const addWhy = () => setFw({ whys: [...fw.whys, newWhy()] });
  const removeWhy = (id) => setFw({ whys: fw.whys.filter((w) => w.id !== id) });

  const prevAnswer = (i) =>
    i === 0 ? fw.problem : fw.whys[i - 1]?.answer || '';

  const promoted = inv.icam.of.some((f) => f.text === fw.rootCause.trim());
  const promote = () => {
    const text = fw.rootCause.trim();
    if (!text || promoted) return;
    update((c) => ({
      ...c,
      icam: {
        ...c.icam,
        of: [...c.icam.of, { ...newIcamFactor('of'), text, notes: 'Promoted from 5 Whys root cause' }],
      },
    }));
    goStep('icam');
  };

  return (
    <section className="rise">
      <SectionHeader
        title="5 Whys"
        sub="Start from the problem and ask why it happened — each answer becomes the next question. Stop when you reach something the organisation can fix."
      />

      <div className="fw-chain">
        <div className="fw-problem">
          <div className="overline">Problem statement</div>
          <textarea
            rows={2}
            value={fw.problem}
            onChange={(e) => setFw({ problem: e.target.value })}
            placeholder="What is the problem? Be specific and factual…"
            aria-label="Problem statement"
          />
        </div>

        {fw.whys.map((w, i) => {
          const prev = prevAnswer(i);
          return (
            <div key={w.id}>
              <div className="fw-connector" />
              <div className="fw-why">
                <div className="fw-n">{i + 1}</div>
                <div className="fw-main">
                  <div className="fw-q">
                    {prev.trim()
                      ? `Why did this happen: “${prev.trim()}”?`
                      : 'Why did the above happen?'}
                  </div>
                  <TextArea
                    value={w.answer}
                    onChange={(v) => setWhy(w.id, { answer: v })}
                    rows={2}
                    placeholder="Because…"
                    aria-label={`Why ${i + 1}`}
                  />
                  <div style={{ marginTop: 8 }}>
                    <EvidencePicker
                      inv={inv}
                      value={w.evidenceIds}
                      onChange={(ids) => setWhy(w.id, { evidenceIds: ids })}
                    />
                  </div>
                </div>
                <IconButton
                  icon="trash"
                  label={`Remove why ${i + 1}`}
                  danger
                  onClick={() => removeWhy(w.id)}
                />
              </div>
            </div>
          );
        })}

        {fw.whys.length < MAX_WHYS && (
          <>
            <div className="fw-connector" />
            <Button
              icon="plus"
              onClick={addWhy}
              style={{ alignSelf: 'flex-start' }}
              disabled={!fw.problem.trim() && fw.whys.length === 0}
            >
              {fw.whys.length === 0 ? 'Ask the first why' : 'Ask why again'}
            </Button>
          </>
        )}

        <div className="fw-connector" />
        <div className="fw-root">
          <div className="overline">Root cause</div>
          <TextArea
            value={fw.rootCause}
            onChange={(v) => setFw({ rootCause: v })}
            rows={2}
            placeholder="The underlying cause the chain points to — usually organisational, not individual."
            style={{ marginTop: 6, background: 'var(--surface)' }}
            aria-label="Root cause"
          />
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button
              size="sm"
              variant="subtle"
              disabled={!fw.rootCause.trim() || promoted}
              onClick={promote}
            >
              <Icon name="link" size={12} />
              {promoted ? 'Promoted to ICAM' : 'Promote to ICAM organisational factor'}
            </Button>
            <span className="hint">
              If the root cause names a person rather than a system, ask why once more.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
