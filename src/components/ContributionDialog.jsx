import { useState } from 'react';
import { ICAM_KINDS, ICAM_ORDER } from '../lib/model.js';
import { Button, Field, Modal, Select } from './ui.jsx';

// The contribution test, as an explicit acknowledgement: a finding only
// becomes a contributing factor once the investigator confirms it is causal.
export const ContributionDialog = ({ text, defaultKind = '', onConfirm, onClose }) => {
  const [kind, setKind] = useState(defaultKind);
  const kindByLabel = (label) =>
    ICAM_ORDER.find((k) => ICAM_KINDS[k].label === label) || '';

  return (
    <Modal
      title="Contribution test"
      onClose={onClose}
      width={540}
      footer={
        <>
          <Button onClick={onClose}>No — keep as context</Button>
          <Button
            variant="primary"
            disabled={!kind}
            onClick={() => onConfirm(kind)}
          >
            Yes, it contributed — add to factor table
          </Button>
        </>
      }
    >
      <div className="contrib-q">
        Would the incident have been prevented — or been less severe — if this
        had been different?
      </div>
      <blockquote className="contrib-text">{text}</blockquote>
      <Field
        label="It contributed as a…"
        hint="Pick the category this factor belongs to in the causal chain."
      >
        <Select
          value={kind ? ICAM_KINDS[kind].label : ''}
          onChange={(label) => setKind(kindByLabel(label))}
          options={ICAM_ORDER.map((k) => ICAM_KINDS[k].label)}
          placeholder="Select a category…"
          aria-label="Factor category"
        />
      </Field>
      <p className="hint" style={{ margin: 0 }}>
        If the honest answer is no, it isn't a contributing factor — it stays
        in the investigation as context, which is just as valuable.
      </p>
    </Modal>
  );
};
