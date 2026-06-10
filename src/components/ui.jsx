import { useEffect, useRef, useState } from 'react';

// ── icons ────────────────────────────────────────────────────
const PATHS = {
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  pencil: <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  doc: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  box: (
    <>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5M12 13v9" />
    </>
  ),
  data: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </>
  ),
  check: <path d="M20 6L9 17l-5-5" />,
  chevronRight: <path d="M9 18l6-6-6-6" />,
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  print: (
    <>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  arrowDown: <path d="M12 5v14M19 12l-7 7-7-7" />,
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.2a2.8 2.8 0 0 1 5.5.7c0 1.8-2.7 2.2-2.7 3.8" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </>
  ),
  upload: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
};

export const Icon = ({ name, size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {PATHS[name] || null}
  </svg>
);

// ── buttons ──────────────────────────────────────────────────
export const Button = ({ variant, size, icon, children, ...rest }) => (
  <button
    type="button"
    className={`btn ${variant || ''} ${size || ''}`.trim()}
    {...rest}
  >
    {icon && <Icon name={icon} size={size === 'sm' ? 12 : 13} />}
    {children}
  </button>
);

export const IconButton = ({ icon, label, danger, size = 14, ...rest }) => (
  <button
    type="button"
    className={`icon-btn ${danger ? 'danger' : ''}`.trim()}
    aria-label={label}
    title={label}
    {...rest}
  >
    <Icon name={icon} size={size} />
  </button>
);

// ── form controls ────────────────────────────────────────────
export const Field = ({ label, hint, children, className }) => (
  <div className={`field ${className || ''}`.trim()}>
    {label && <label>{label}</label>}
    {children}
    {hint && <div className="hint">{hint}</div>}
  </div>
);

export const Input = ({ value, onChange, ...rest }) => (
  <input
    className="input"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  />
);

export const TextArea = ({ value, onChange, rows = 3, ...rest }) => (
  <textarea
    className="textarea"
    rows={rows}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  />
);

export const Select = ({ value, onChange, options, placeholder, ...rest }) => (
  <select
    className="select"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  >
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

export const Segmented = ({ value, onChange, options, colorFor }) => (
  <div className="segmented" role="radiogroup">
    {options.map((o) => (
      <button
        key={o}
        type="button"
        role="radio"
        aria-checked={value === o}
        className={value === o ? 'on' : ''}
        style={
          value === o && colorFor
            ? { background: colorFor(o), color: '#fff' }
            : undefined
        }
        onClick={() => onChange(o)}
      >
        {o}
      </button>
    ))}
  </div>
);

// ── hover help ───────────────────────────────────────────────
// First line is the "what we're after" summary; the rest render as prompts.
export const HelpTip = ({ title, lines }) => (
  <span className="helptip" tabIndex={0} aria-label={`Help: ${title}`}>
    <Icon name="help" size={13} />
    <span className="helptip-pop" role="tooltip">
      <strong>{title}</strong>
      <p>{lines[0]}</p>
      {lines.length > 1 && (
        <ul>
          {lines.slice(1).map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </span>
  </span>
);

// ── tag ──────────────────────────────────────────────────────
export const Tag = ({ tone, children }) => (
  <span className={`tag ${tone || ''}`.trim()}>{children}</span>
);

// ── modal ────────────────────────────────────────────────────
export const Modal = ({ title, onClose, footer, width = 560, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const el = ref.current?.querySelector('input, textarea, select, button');
    el?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <IconButton icon="x" label="Close" onClick={onClose} size={16} />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}) => (
  <Modal
    title={title}
    onClose={onClose}
    width={420}
    footer={
      <>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>{message}</p>
  </Modal>
);

// ── empty state ──────────────────────────────────────────────
export const EmptyState = ({ icon, title, hint, action }) => (
  <div className="empty-state">
    {icon && <Icon name={icon} size={22} />}
    <div className="e-title">{title}</div>
    {hint && <div className="e-hint">{hint}</div>}
    {action}
  </div>
);

// ── section header ───────────────────────────────────────────
export const SectionHeader = ({ title, sub, actions }) => (
  <div className="section-head">
    <div>
      <h2>{title}</h2>
      {sub && <div className="sub">{sub}</div>}
    </div>
    {actions && <div className="actions">{actions}</div>}
  </div>
);

// ── evidence linking (shared) ────────────────────────────────
export const EvidenceChips = ({ inv, ids }) => {
  const items = (ids || [])
    .map((id) => inv.evidence.find((e) => e.id === id))
    .filter(Boolean);
  if (!items.length) return null;
  return (
    <>
      {items.map((e) => (
        <span key={e.id} className="chip" title={e.title}>
          <span className="ref">{e.ref}</span>
          <span className="t">{e.title || e.type}</span>
        </span>
      ))}
    </>
  );
};

export const EvidencePicker = ({ inv, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const selected = value || [];
  if (!inv.evidence.length) {
    return (
      <div className="hint">
        No evidence collected yet — items added in the Evidence step can be
        linked here.
      </div>
    );
  }
  const toggle = (id) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <EvidenceChips inv={inv} ids={selected} />
        <Button size="sm" icon="link" onClick={() => setOpen(!open)}>
          {open ? 'Done' : selected.length ? 'Edit links' : 'Link evidence'}
        </Button>
      </div>
      {open && (
        <div
          style={{
            marginTop: 8,
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {inv.evidence.map((e) => (
            <label
              key={e.id}
              style={{
                display: 'flex',
                gap: 9,
                alignItems: 'baseline',
                padding: '7px 11px',
                borderBottom: '1px solid var(--line)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(e.id)}
                onChange={() => toggle(e.id)}
              />
              <span className="mono" style={{ color: 'var(--steel)', fontWeight: 600 }}>
                {e.ref}
              </span>
              <span>{e.title || e.type}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
