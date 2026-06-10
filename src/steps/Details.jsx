import { INCIDENT_TYPES, SEVERITIES, SEVERITY_COLOR } from '../lib/model.js';
import { Field, Input, Segmented, SectionHeader, Select, TextArea } from '../components/ui.jsx';

export const DetailsStep = ({ inv, update }) => {
  const d = inv.details;
  const set = (key) => (value) =>
    update((c) => ({ ...c, details: { ...c.details, [key]: value } }));
  const setTitle = (value) => update((c) => ({ ...c, title: value }));

  return (
    <section className="rise">
      <SectionHeader
        title="Incident details"
        sub="Capture the facts as first reported. Stick to what is known — analysis comes later."
      />
      <div className="details-grid">
        <Field label="Title" className="span-2">
          <Input
            value={inv.title}
            onChange={setTitle}
            placeholder="Short factual description of the incident"
          />
        </Field>

        <Field label="Date occurred">
          <input
            className="input"
            type="date"
            value={d.occurredOn}
            onChange={(e) => set('occurredOn')(e.target.value)}
          />
        </Field>
        <Field label="Time (approx.)">
          <input
            className="input"
            type="time"
            value={d.occurredTime}
            onChange={(e) => set('occurredTime')(e.target.value)}
          />
        </Field>

        <Field label="Site / facility">
          <Input value={d.site} onChange={set('site')} placeholder="e.g. Plant 2" />
        </Field>
        <Field label="Exact location">
          <Input
            value={d.location}
            onChange={set('location')}
            placeholder="e.g. Warehouse B, aisle 4"
          />
        </Field>

        <Field label="Reported by">
          <Input value={d.reportedBy} onChange={set('reportedBy')} placeholder="Name" />
        </Field>
        <Field label="Lead investigator">
          <Input value={d.lead} onChange={set('lead')} placeholder="Name" />
        </Field>

        <Field label="Incident type">
          <Select
            value={d.type}
            onChange={set('type')}
            options={INCIDENT_TYPES}
            placeholder="Select type…"
          />
        </Field>
        <Field label="Severity" hint="Actual or credible potential consequence.">
          <Segmented
            value={d.severity}
            onChange={set('severity')}
            options={SEVERITIES}
            colorFor={(s) => SEVERITY_COLOR[s]}
          />
        </Field>

        <Field
          label="What happened"
          className="span-2"
          hint="A plain factual account — who, what, where, when. Avoid speculation about causes."
        >
          <TextArea
            value={d.description}
            onChange={set('description')}
            rows={5}
            placeholder="Describe the sequence of events as currently understood…"
          />
        </Field>

        <Field label="Immediate actions taken" className="span-2">
          <TextArea
            value={d.immediateActions}
            onChange={set('immediateActions')}
            rows={3}
            placeholder="First aid, isolation, make-safe, notifications…"
          />
        </Field>
      </div>
    </section>
  );
};
