import React from 'react';
import { ExternalLink, ArrowLeftRight, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const severityBadge = (s) => {
  const map = { info: 'badge-neutral', warning: 'badge-warning', error: 'badge-danger', critical: 'badge-danger' };
  return map[s] || 'badge-neutral';
};

const operationLabel = (type) => {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const Transactions = () => {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const LIMIT = 15;

  const fetchTransactions = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, hasTx: 'true' });
      const { data } = await api.get(`/audit?${params}`);
      // Filter to only events with tx hashes
      const all = data.data || [];
      const txEvents = all.filter(e => e.txHash);
      setEvents(txEvents);
      setTotal(data.meta?.total || txEvents.length);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-sub">Blockchain transactions recorded on Ethereum Sepolia.</p>
        </div>
        <div className="page-actions">
          <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={13} />
            Etherscan
          </a>
          <button className="btn btn-ghost btn-icon" onClick={fetchTransactions} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-row"><div className="loading-spinner-large" />Loading transactions...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <ArrowLeftRight size={32} className="empty-state-icon" />
            <div className="empty-state-title">No blockchain transactions yet</div>
            <div className="empty-state-sub">Transactions will appear here as you mint assets and register identities.</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>TX Hash</th>
                    <th>Operation</th>
                    <th>Actor</th>
                    <th>Severity</th>
                    <th>Timestamp</th>
                    <th>Network</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev.id}>
                      <td>
                        <span className="mono" style={{ fontSize: '0.75rem' }}>
                          {ev.txHash?.slice(0, 18)}…
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue">
                          {operationLabel(ev.eventType)}
                        </span>
                      </td>
                      <td className="text-primary" style={{ fontWeight: 500, fontSize: '0.8375rem' }}>
                        {ev.actor?.name || ev.actorRole || 'System'}
                      </td>
                      <td>
                        <span className={`badge ${severityBadge(ev.severity)}`}>
                          {ev.severity || 'info'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(ev.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-success">Sepolia</span>
                      </td>
                      <td>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${ev.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-icon btn-sm"
                          title="View on Etherscan"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">Page {page} of {totalPages}</div>
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
