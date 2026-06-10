import { useCases } from '../App.jsx';
import { stepsFor, stepStatus } from '../lib/progress.js';
import { METHODS } from '../lib/model.js';
import { Button, Icon, Tag } from './ui.jsx';
import { DetailsStep } from '../steps/Details.jsx';
import { EvidenceStep } from '../steps/Evidence.jsx';
import { InterviewsStep } from '../steps/Interviews.jsx';
import { TimelineStep } from '../steps/Timeline.jsx';
import { FiveWhysStep } from '../steps/FiveWhys.jsx';
import { IcamStep } from '../steps/Icam.jsx';
import { HfatStep } from '../steps/Hfat.jsx';
import { ActionsStep } from '../steps/Actions.jsx';
import { ReportStep } from '../steps/Report.jsx';

const STEP_VIEWS = {
  details: DetailsStep,
  evidence: EvidenceStep,
  interviews: InterviewsStep,
  timeline: TimelineStep,
  fiveWhys: FiveWhysStep,
  icam: IcamStep,
  hfat: HfatStep,
  actions: ActionsStep,
  report: ReportStep,
};

export const CaseShell = ({ inv }) => {
  const { goHome, goStep, route, updateCase } = useCases();
  const steps = stepsFor(inv);
  const step =
    STEP_VIEWS[route.step] && steps.some((s) => s.key === route.step)
      ? route.step
      : 'details';
  const statuses = stepStatus(inv);
  const idx = steps.findIndex((s) => s.key === step);
  const View = STEP_VIEWS[step];

  const update = (fn) => updateCase(inv.id, fn);
  const toggleStatus = () =>
    update((c) => ({ ...c, status: c.status === 'Open' ? 'Closed' : 'Open' }));
  const toggleMethod = (key) =>
    update((c) => ({
      ...c,
      methods: { ...c.methods, [key]: !c.methods[key] },
    }));

  return (
    <div className="shell">
      <nav className="rail no-print" aria-label="Investigation steps">
        <button className="rail-back" onClick={goHome}>
          <Icon name="chevronLeft" size={13} />
          All investigations
        </button>
        <div className="rail-case">
          <div className="ref">{inv.ref}</div>
          <h2>{inv.title}</h2>
          <div className="rail-meta">
            <Tag tone={inv.status === 'Closed' ? 'ok' : 'steel'}>{inv.status}</Tag>
            <button
              className="rail-back"
              style={{ margin: 0, fontSize: 11.5 }}
              onClick={toggleStatus}
            >
              {inv.status === 'Open' ? 'Close investigation' : 'Reopen'}
            </button>
          </div>
        </div>
        <div className="rail-methods">
          <div className="overline" style={{ fontSize: 10 }}>
            Analysis tools
          </div>
          <div className="method-toggles">
            {METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={`method-chip ${inv.methods[m.key] ? 'on' : ''}`}
                aria-pressed={inv.methods[m.key]}
                onClick={() => toggleMethod(m.key)}
              >
                {inv.methods[m.key] && <Icon name="check" size={10} />}
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rail-steps">
          {steps.map((s, i) => {
            const st = statuses[s.key];
            return (
              <button
                key={s.key}
                className={`step-link ${st} ${s.key === step ? 'active' : ''}`}
                onClick={() => goStep(s.key)}
                aria-current={s.key === step ? 'step' : undefined}
              >
                <span className="s-ind">
                  {st === 'done' && <Icon name="check" size={10} />}
                </span>
                <span className="s-num">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="rail-foot">
          Work top to bottom — each step feeds the next. Everything saves
          automatically on this device.
        </div>
      </nav>

      <main className="content">
        <div className="content-inner">
          <View key={inv.id + step} inv={inv} update={update} />
          <div className="step-foot no-print">
            {idx > 0 && (
              <Button icon="chevronLeft" onClick={() => goStep(steps[idx - 1].key)}>
                {steps[idx - 1].label}
              </Button>
            )}
            <div className="spacer" />
            {idx < steps.length - 1 && (
              <Button variant="primary" onClick={() => goStep(steps[idx + 1].key)}>
                Continue to {steps[idx + 1].label}
                <Icon name="chevronRight" size={13} />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
