import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api.js';
import { Spinner, ErrorBox, Empty } from './ui.jsx';
import { fmtDateLong } from '../format.js';

const STATUS_CLASS = { approved: 'green', active: 'green', pending: 'amber', rejected: 'red', suspended: 'red' };

export function StatusBadge({ status }) {
  const label = status ? status[0].toUpperCase() + status.slice(1) : '';
  return <span className={`tag ${STATUS_CLASS[status] || ''}`}>{label}</span>;
}

export function RoleBadge({ role }) {
  const cls = { admin: 'red', coach: 'blue', player: 'green', referee: 'amber' }[role] || '';
  return <span className={`tag ${cls}`}>{role}</span>;
}

export function StatTiles({ items }) {
  return (
    <div className="grid grid-4">
      {items.map((it, i) => (
        <div key={i} className="stat">
          <div className="n">{it.n}</div>
          <div className="k">{it.k}</div>
        </div>
      ))}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="chip-row">
      {tabs.map((t) => (
        <button key={t.key} className={`chip${active === t.key ? ' active' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}{t.count != null ? ` (${t.count})` : ''}
        </button>
      ))}
    </div>
  );
}

// Self-contained "my documents" panel: list + submission form.
export function DocumentsPanel({ presetTypes = [], title = 'My Documents' }) {
  const [docs, setDocs] = useState(null);
  const [err, setErr] = useState(null);
  const [type, setType] = useState(presetTypes[0] || '');
  const [custom, setCustom] = useState('');
  const [file, setFile] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setErr(null);
    apiGet('/me/documents')
      .then(setDocs)
      .catch((e) => { setErr(e.message); setDocs([]); }); // stop the spinner even on failure
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    const finalType = type === '__other' ? custom.trim() : type;
    if (!finalType) { setErr('Please choose a document type.'); return; }
    setBusy(true); setErr(null);
    try {
      await apiPost('/me/documents', { type: finalType, title: file.trim() || undefined });
      setFile(''); setCustom(''); setType(presetTypes[0] || '');
      load();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <section className="card">
      <div className="card-head">
        <h3>{title}</h3>
        {docs && <span className="tag">{docs.length} on file</span>}
      </div>

      <form onSubmit={submit} style={{ padding: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          {presetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          <option value="__other">Other…</option>
        </select>
        {type === '__other' && (
          <input className="input" placeholder="Document type" value={custom} onChange={(e) => setCustom(e.target.value)} style={{ flex: '1 1 150px' }} />
        )}
        <input className="input" placeholder="File name (e.g. passport.pdf)" value={file} onChange={(e) => setFile(e.target.value)} style={{ flex: '1 1 180px' }} />
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Uploading…' : '⬆ Upload'}</button>
      </form>
      <div className="muted" style={{ fontSize: 12, padding: '8px 16px 0' }}>
        Demo: submissions are recorded and sent for review. A production build would store the encrypted file.
      </div>

      {err && <div style={{ padding: 16 }}><ErrorBox message={err} /></div>}
      {docs == null ? <Spinner /> : docs.length === 0 ? <Empty>No documents submitted yet.</Empty> : (
        <ul className="list-reset">
          {docs.map((d) => (
            <li key={d.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <span aria-hidden style={{ fontSize: 18 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{d.type}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {d.title} · submitted {fmtDateLong(d.submitted_at)}
                  {d.status === 'rejected' && d.notes ? ` · ${d.notes}` : ''}
                </div>
              </div>
              <StatusBadge status={d.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
