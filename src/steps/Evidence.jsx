import { useRef, useState } from 'react';
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

// Files live in localStorage, so they must stay small. Images are downscaled
// and recompressed; anything else is capped at ~1.5 MB.
const MAX_FILE_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;

const fmtBytes = (n) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });

const downscaleImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image.'));
    };
    img.src = url;
  });

const fileToAttachment = async (file) => {
  if (file.type.startsWith('image/')) {
    const dataUrl = await downscaleImage(file);
    return { name: file.name, type: 'image/jpeg', size: dataUrl.length, dataUrl };
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `“${file.name}” is ${fmtBytes(file.size)} — too large to store in the browser (max 1.5 MB for non-image files). Log it as evidence and keep the original in your document system.`
    );
  }
  const dataUrl = await readAsDataUrl(file);
  return { name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl };
};

const isImage = (f) => f?.type?.startsWith('image/');

const Dropzone = ({ file, onAttach, onClear }) => {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  const handle = async (f) => {
    if (!f) return;
    setError('');
    try {
      onAttach(await fileToAttachment(f));
    } catch (err) {
      setError(err.message);
    }
  };

  if (file) {
    return (
      <div className="file-attached">
        {isImage(file) ? (
          <img src={file.dataUrl} alt={file.name} />
        ) : (
          <Icon name="doc" size={20} />
        )}
        <div className="f-name">
          {file.name}
          <div className="f-size">{fmtBytes(file.size)}</div>
        </div>
        <a className="btn sm" href={file.dataUrl} download={file.name}>
          <Icon name="download" size={12} />
          Download
        </a>
        <IconButton icon="trash" label="Remove file" danger onClick={onClear} />
      </div>
    );
  }

  return (
    <div
      className={`dropzone ${over ? 'over' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files?.[0]);
      }}
    >
      <Icon name="upload" size={18} />
      <div>
        <strong>Drop a file here</strong> or click to choose — photo, PDF, document…
      </div>
      <div>Images are resized automatically; other files up to 1.5 MB.</div>
      {error && <div className="dz-err">{error}</div>}
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = '';
        }}
        aria-label="Attach a file"
      />
    </div>
  );
};

const EvidenceModal = ({ initial, onSave, onClose }) => {
  const [draft, setDraft] = useState(initial);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const valid = draft.title.trim();
  const attach = (file) =>
    setDraft((d) => ({
      ...d,
      file,
      type: isImage(file) && d.type === 'Document' ? 'Photo' : d.type,
      title: d.title || file.name.replace(/\.[^.]+$/, ''),
    }));
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
      <Field label="File">
        <Dropzone
          file={draft.file}
          onAttach={attach}
          onClear={() => setDraft((d) => ({ ...d, file: null }))}
        />
      </Field>
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
      peepo: c.peepo.map((p) => ({
        ...p,
        evidenceIds: p.evidenceIds.filter((x) => x !== id),
      })),
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
              {isImage(e.file) ? (
                <img className="ev-thumb" src={e.file.dataUrl} alt={e.title} />
              ) : (
                <div className="e-icon">
                  <Icon name={TYPE_ICON[e.type] || 'doc'} size={15} />
                </div>
              )}
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
                  {e.file && (
                    <a
                      href={e.file.dataUrl}
                      download={e.file.name}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Icon name="download" size={11} />
                      {e.file.name}
                    </a>
                  )}
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
