import React from 'react';
import { Search, Download, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import api from '../utils/api';

const eventTypeColor = (type) => {
  if (type?.includes('CREATED')) return 'badge-success';
  if (type?.includes('TRANSFERRED')) return 'badge-blue';
  if (type?.includes('MINTED')) return 'badge-info';
  if (type?.includes('REVOKED') || type?.includes('SUSPENDED')) return 'badge-danger';
  if (type?.includes('LOGIN')) return 'badge-neutral';
  if (type?.includes('REACTIVATED')) return 'badge-success';
  return 'badge-neutral';
};

const severityColor = (sev) => {
  const map = { info: 'badge-neutral', warning: 'badge-warning', error: 'badge-danger', critical: 'badge-danger' };
  return map[sev] || 'badge-neutral';
};

const EventDetailModal = ({ event, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <span className="modal-title">Audit Event — #{event.sequenceNo}</span>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Event Type', value: <span className={`badge ${eventTypeColor(event.eventType)}`}>{event.eventType?.replace(/_/g, ' ')}</span> },
            { label: 'Severity', value: <span className={`badge ${severityColor(event.severity)}`}>{event.severity || 'info'}</span> },
            { label: 'Action', value: event.action },
            { label: 'Entity Type', value: event.entityType || '—' },
            { label: 'Actor', value: event.actor ? `${event.actor.name} (${event.actor.email})` : (event.actorRole || 'System') },
            { label: 'Timestamp', value: new Date(event.createdAt).toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="form-group" style={{ marginBottom: 0 }}>
              <div className="form-label">{label}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
            </div>
          ))}
          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <div className="form-label">Entity ID</div>
            <div className="mono" style={{ display: 'block', marginTop: 4, wordBreak: 'break-all' }}>{event.entityId || '—'}</div>
          </div>
          {event.txHash && (
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <div className="form-label">Transaction Hash</div>
              <div className="mono" style={{ display: 'block', marginTop: 4, wordBreak: 'break-all' }}>{event.txHash}</div>
            </div>
          )}
          <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
            <div className="form-label">Event Hash</div>
            <div className="mono" style={{ display: 'block', marginTop: 4, wordBreak: 'break-all', fontSize: '0.7rem' }}>{event.eventHash}</div>
          </div>
          {event.payload && (
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <div className="form-label">Payload</div>
              <pre style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.625rem', borderRadius: 6, overflow: 'auto', border: '1px solid var(--border)' }}>
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const IntegrityModal = ({ result, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <span className="modal-title">Audit Chain Integrity Check</span>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="modal-body">
        <div className={`alert ${result.isValid ? 'alert-success' : 'alert-error'}`}>
          {result.isValid ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {result.isValid ? 'Audit chain integrity verified — no tampering detected.' : `Integrity breach at sequence #${result.brokenAtSequence}`}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Total Events Verified</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{result.totalEvents}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Hash Chain Status</span>
            <span style={{ color: result.isValid ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              {result.isValid ? 'Valid' : 'Compromised'}
            </span>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

export const AuditLogs = () => {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [eventTypeFilter, setEventTypeFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [selectedEvent, setSelectedEvent] = React.useState(null);
  const [verifyLoading, setVerifyLoading] = React.useState(false);
  const [verifyResult, setVerifyResult] = React.useState(null);
  const LIMIT = 20;

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (eventTypeFilter) params.append('eventType', eventTypeFilter);
      const { data } = await api.get(`/audit?${params}`);
      setLogs(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, eventTypeFilter]);

  React.useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleVerifyIntegrity = async () => {
    setVerifyLoading(true);
    try {
      const { data } = await api.get('/audit/verify-integrity');
      setVerifyResult(data.data);
    } catch (err) {
      alert('Failed to verify audit integrity.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Seq', 'Event Type', 'Entity Type', 'Entity ID', 'Actor', 'Action', 'Timestamp', 'Tx Hash', 'Event Hash'],
      ...logs.map(e => [
        e.sequenceNo, e.eventType, e.entityType, e.entityId || '',
        e.actor?.name || e.actorRole || 'System', e.action,
        new Date(e.createdAt).toISOString(),
        e.txHash || '', e.eventHash
      ])
    ].map(row => row.map(v => `"${v}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = search
    ? logs.filter(l =>
        l.eventType?.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId?.toLowerCase().includes(search.toLowerCase()) ||
        l.actor?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.txHash?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(total / LIMIT);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-sub">Cryptographically chained, immutable event history.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-icon" onClick={fetchLogs} title="Refresh"><RefreshCw size={15} /></button>
          <button className="btn btn-secondary" onClick={handleVerifyIntegrity} disabled={verifyLoading}>
            {verifyLoading ? <span className="spinner-sm" /> : <ShieldCheck size={15} />}
            Verify Chain
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 340 }}>
            <div className="search-bar-icon"><Search size={15} /></div>
            <input
              type="text"
              placeholder="Search events, entities, actors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 180 }}
            value={eventTypeFilter}
            onChange={e => { setEventTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Event Types</option>
            <option value="IDENTITY_CREATED">Identity Created</option>
            <option value="IDENTITY_REVOKED">Identity Revoked</option>
            <option value="IDENTITY_SUSPENDED">Identity Suspended</option>
            <option value="ASSET_MINTED">Asset Minted</option>
            <option value="ASSET_TRANSFERRED">Asset Transferred</option>
            <option value="USER_LOGIN">User Login</option>
          </select>
          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {total} event{total !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Event Type</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>Time</th>
                <th>Severity</th>
                <th>Event Hash</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="loading-row" style={{ padding: 0 }}>
                      <div className="loading-spinner-large" style={{ width: 24, height: 24, borderWidth: 2 }} />
                      Loading audit events...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <ShieldCheck size={32} className="empty-state-icon" />
                      <div className="empty-state-title">No audit events found</div>
                      <div className="empty-state-sub">Audit events will appear here as actions are performed.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedEvent(log)}
                    title="Click for details"
                  >
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      #{log.sequenceNo}
                    </td>
                    <td>
                      <span className={`badge ${eventTypeColor(log.eventType)}`} style={{ fontSize: '0.65rem' }}>
                        {log.eventType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{log.entityType}</span>
                      {log.entityId && (
                        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {log.entityId.length > 20 ? log.entityId.slice(0, 20) + '...' : log.entityId}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {log.actor?.name || log.actorRole || 'System'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {timeAgo(log.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${severityColor(log.severity)}`} style={{ fontSize: '0.65rem' }}>
                        {log.severity || 'info'}
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: '0.7rem' }} title={log.eventHash}>
                        {log.eventHash?.slice(0, 12)}...
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total}
            </div>
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {verifyResult && <IntegrityModal result={verifyResult} onClose={() => setVerifyResult(null)} />}
    </div>
  );
};
