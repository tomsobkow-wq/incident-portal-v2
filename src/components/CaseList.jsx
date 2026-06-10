import { useRef, useState } from 'react';
import { useCases } from '../App.jsx';
import { SEVERITY_COLOR, fmtDate } from '../lib/model.js';
import { overallProgress } from '../lib/progress.js';
import { Button, ConfirmDialog, EmptyState, Icon, IconButton, Input, Modal, Tag } from './ui.jsx';

// Download one investigation as a .json backup file.
const exportCase = (c) => {
  const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.ref} ${c.title}.json`.replace(/[/\\:*?"<>|]/g, '-');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

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
  const { cases, openCase, deleteCase, importCase } = useCases();
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [importError, setImportError] = useState('');
  const importRef = useRef(null);

  const handleImport = async (file) => {
    if (!file) return;
    setImportError('');
    try {
      const obj = JSON.parse(await file.text());
      if (!obj || typeof obj.title !== 'string' || !obj.ref) {
        throw new Error('not a case file');
      }
      importCase(obj);
    } catch {
      setImportError(
        `“${file.name}” doesn’t look like an Incident Portal case file (.json exported from the list).`
      );
    }
  };

  return (
    <div className="home">
      <header className="home-head rise">
        <div>
          <div className="overline">Incident Portal</div>
          <h1>Investigations</h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button icon="upload" onClick={() => importRef.current?.click()}>
            Import
          </Button>
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            New investigation
          </Button>
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          aria-label="Import a case backup"
          onChange={(e) => {
            handleImport(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </header>
      {importError && (
        <div
          className="card pad rise"
          style={{ marginBottom: 14, borderColor: 'var(--accent)', background: 'var(--accent-tint)', fontSize: 13 }}
        >
          {importError}
        </div>
      )}

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
                  icon="download"
                  label={`Export ${c.ref} as a backup file`}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportCase(c);
                  }}
                />
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
