import { useState } from 'react';
import { useCases } from '../App.jsx';
import { SEVERITY_COLOR, fmtDate } from '../lib/model.js';
import { overallProgress } from '../lib/progress.js';
import { Button, ConfirmDialog, EmptyState, Icon, IconButton, Input, Modal, Tag } from './ui.jsx';

const NewCaseModal = ({ onClose }) => {
  const { createCase } = useCases();
  const [title, setTitle] = useState('');
  const submit = () => {
    if (!title.trim()) return;
    createCase(title);
    onClose();
  };
  return (
    <Modal
      title="New investigation"
      onClose={onClose}
      width={480}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!title.trim()}>
            Start investigation
          </Button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="new-title">What happened? (short title)</label>
        <Input
          id="new-title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. Forklift collision with racking — Warehouse B"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <div className="hint">
          A reference number is assigned automatically. Everything else is
          captured inside the investigation.
        </div>
      </div>
    </Modal>
  );
};

export const CaseList = () => {
  const { cases, openCase, deleteCase } = useCases();
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  return (
    <div className="home">
      <header className="home-head rise">
        <div>
          <div className="overline">Incident Portal</div>
          <h1>Investigations</h1>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
          New investigation
        </Button>
      </header>

      {cases.length === 0 ? (
        <div className="rise rise-1">
          <EmptyState
            icon="folder"
            title="No investigations yet"
            hint="Start your first one — you'll be guided from incident details through evidence, analysis and reporting."
            action={
              <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
                New investigation
              </Button>
            }
          />
        </div>
      ) : (
        <div className="case-list">
          {cases.map((c, i) => {
            const p = overallProgress(c);
            return (
              <div
                key={c.id}
                className={`case-row rise rise-${Math.min(i + 1, 6)}`}
                role="button"
                tabIndex={0}
                onClick={() => openCase(c.id)}
                onKeyDown={(e) => e.key === 'Enter' && openCase(c.id)}
              >
                <span
                  className="sev-dot"
                  style={{
                    background: SEVERITY_COLOR[c.details.severity] || 'var(--line-strong)',
                  }}
                  title={c.details.severity || 'Severity not set'}
                />
                <div className="c-main">
                  <div className="c-title">{c.title}</div>
                  <div className="c-meta">
                    <span className="mono">{c.ref}</span>
                    <span>Opened {fmtDate(c.createdAt)}</span>
                    {c.details.location && <span>{c.details.location}</span>}
                  </div>
                </div>
                <Tag tone={c.status === 'Closed' ? 'ok' : 'steel'}>{c.status}</Tag>
                <div className="c-progress">
                  <div className="progress-bar">
                    <div style={{ width: `${p.fraction * 100}%` }} />
                  </div>
                  <span className="mono muted" style={{ fontSize: 11 }}>
                    {p.done}/{p.total}
                  </span>
                </div>
                <IconButton
                  icon="trash"
                  label={`Delete ${c.ref}`}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    setToDelete(c);
                  }}
                />
                <span className="chev">
                  <Icon name="chevronRight" size={15} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {creating && <NewCaseModal onClose={() => setCreating(false)} />}
      {toDelete && (
        <ConfirmDialog
          title="Delete investigation"
          message={`Delete ${toDelete.ref} — “${toDelete.title}”? This permanently removes the investigation and everything in it.`}
          confirmLabel="Delete investigation"
          onConfirm={() => deleteCase(toDelete.id)}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
};
