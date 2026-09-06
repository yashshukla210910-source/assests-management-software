import React from 'react';
import { Search, UserPlus, MoreVertical, Filter, RefreshCw, X, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

const statusBadge = (status) => {
  const map = { active: 'badge-success', suspended: 'badge-warning', revoked: 'badge-danger' };
  return map[status] || 'badge-neutral';
};

const CreateIdentityModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = React.useState({ name: '', email: '', organization: '', role: 'user', password: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/identities', form);
      setResult(data.data);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create identity. Make sure email is unique.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Identity Created</span>
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body">
            <div className="alert alert-success">
              <CheckCircle size={16} />
              Identity registered successfully on blockchain!
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div className="form-label">DID</div>
                <div className="mono" style={{ wordBreak: 'break-all', display: 'block', marginTop: 4 }}>{result.did}</div>
              </div>
              <div>
                <div className="form-label">Ethereum Address</div>
                <div className="mono" style={{ display: 'block', marginTop: 4 }}>{result.address}</div>
              </div>
              <div>
                <div className="form-label">Transaction Hash</div>
                <div className="mono" style={{ display: 'block', marginTop: 4 }}>{result.txHash}</div>
              </div>
              {result.temporaryPassword && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} />
                  <div>
                    <strong>Temporary Password:</strong> {result.temporaryPassword}
                    <br /><span style={{ fontSize: '0.75rem' }}>Share this securely with the user.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Register New Identity</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Full Name *</label>
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Alice Johnson" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Work Email *</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="alice@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Organization</label>
                <input className="form-input" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="Department / Company" />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">Standard User</option>
                  <option value="manager">Asset Manager</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Initial Password (optional)</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to auto-generate" />
                <span className="form-error" style={{ color: 'var(--text-muted)' }}>If blank, a temporary password will be generated.</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              A DID (Decentralized Identifier) will be generated and registered on the configured blockchain network.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner-sm" />}
              {loading ? 'Registering...' : 'Register Identity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ActionsMenu = ({ identity, onUpdate }) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const isAdmin = useAuthStore(s => s.user?.roles?.includes('admin'));

  const doAction = async (action) => {
    setOpen(false);
    if (!isAdmin) return alert('Insufficient permissions.');
    setLoading(true);
    try {
      await api.patch(`/identities/${encodeURIComponent(identity.did)}/${action}`);
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => setOpen(v => !v)}
        disabled={loading}
      >
        {loading ? <span className="spinner-sm" /> : <MoreVertical size={15} />}
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-md)',
          minWidth: 160
        }}>
          {[
            { label: 'View Details', action: null, fn: () => alert(`DID: ${identity.did}\nAddress: ${identity.address}\nStatus: ${identity.status}`) },
            identity.status === 'active'
              ? { label: 'Suspend', action: 'suspend', fn: () => doAction('suspend') }
              : identity.status === 'suspended'
              ? { label: 'Reactivate', action: 'suspend', fn: () => doAction('suspend') }
              : null,
            identity.status !== 'revoked'
              ? { label: 'Revoke', action: 'revoke', danger: true, fn: () => { if (confirm('Revoke this identity permanently?')) doAction('revoke'); } }
              : null,
          ].filter(Boolean).map(item => (
            <button
              key={item.label}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.5rem 0.875rem', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '0.8125rem',
                color: item.danger ? 'var(--danger)' : 'var(--text-primary)',
                fontFamily: 'inherit',
                transition: 'background 0.1s'
              }}
              onMouseOver={e => e.target.style.background = 'var(--bg-hover)'}
              onMouseOut={e => e.target.style.background = 'none'}
              onClick={item.fn}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Identities = () => {
  const [identities, setIdentities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [showCreate, setShowCreate] = React.useState(false);
  const user = useAuthStore(s => s.user);
  const canCreate = user?.roles?.includes('admin') || user?.roles?.includes('manager');
  const LIMIT = 10;

  const fetchIdentities = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/identities?${params}`);
      setIdentities(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (err) {
      setIdentities([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  React.useEffect(() => {
    const timer = setTimeout(fetchIdentities, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchIdentities]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Identities</h1>
          <p className="page-sub">Manage decentralized identities (DIDs) and associated roles.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-icon" onClick={fetchIdentities} title="Refresh">
            <RefreshCw size={15} />
          </button>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <UserPlus size={15} />
              Register Identity
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <div className="search-bar-icon"><Search size={15} /></div>
            <input
              type="text"
              placeholder="Search by name, email, or DID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: 130 }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>
          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {total} result{total !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name & Email</th>
                <th>DID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="loading-row" style={{ padding: 0 }}>
                      <div className="loading-spinner-large" style={{ width: 24, height: 24, borderWidth: 2 }} />
                      Loading identities...
                    </div>
                  </td>
                </tr>
              ) : identities.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <UserPlus size={32} className="empty-state-icon" />
                      <div className="empty-state-title">No identities found</div>
                      <div className="empty-state-sub">
                        {search || statusFilter ? 'Try adjusting your search filters.' : 'Register your first identity to get started.'}
                      </div>
                      {canCreate && !search && !statusFilter && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
                          <UserPlus size={14} /> Register Identity
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                identities.map(identity => (
                  <tr key={identity.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {identity.user?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {identity.user?.email}
                        {identity.user?.organization && (
                          <span style={{ marginLeft: 6, opacity: 0.7 }}>• {identity.user.organization}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="mono" title={identity.did}>
                        {identity.did?.length > 28 ? identity.did.slice(0, 28) + '...' : identity.did}
                      </span>
                    </td>
                    <td>
                      {identity.user?.userRoles?.map(ur => (
                        <span key={ur.role.name} className={`role-chip-${ur.role.name}`} style={{ marginRight: 4 }}>
                          {ur.role.displayName || ur.role.name}
                        </span>
                      ))}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(identity.status)}`}>
                        {identity.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(identity.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <ActionsMenu identity={identity} onUpdate={fetchIdentities} />
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

      {showCreate && (
        <CreateIdentityModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { fetchIdentities(); }}
        />
      )}
    </div>
  );
};
