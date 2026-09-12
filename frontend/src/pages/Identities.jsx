import React from 'react';
import { Search, UserPlus, MoreVertical, Filter, RefreshCw, X, CheckCircle, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { getExplorerUrl, getExplorerNetworkName } from '../utils/explorer';

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
      setError(err.response?.data?.error?.message || 'Failed to create identity. Please try again or check your network connection.');
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
            
            <div className="panel" style={{ padding: '1rem', marginTop: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 600 }}>
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                Blockchain Proof
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <div className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Network</div>
                  <div style={{ fontWeight: 500 }}>{getExplorerNetworkName()}</div>
                </div>
                <div>
                  <div className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>DID</div>
                  <div className="mono" style={{ wordBreak: 'break-all', display: 'block', marginTop: 4 }}>{result.did}</div>
                </div>
                {result.privateKey && result.privateKey !== 'EXTERNAL_WALLET' && (
                  <div>
                    <div className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Private Key</div>
                    <div className="mono" style={{ wordBreak: 'break-all', display: 'block', marginTop: 4, background: '#fee2e2', color: '#b91c1c', padding: '0.5rem', borderRadius: '4px' }}>
                      {result.privateKey}
                    </div>
                  </div>
                )}
                <div>
                  <div className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Ethereum Address</div>
                  <div className="mono" style={{ display: 'block', marginTop: 4 }}>{result.address}</div>
                </div>
                <div>
                  <div className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Transaction Hash</div>
                  <div className="mono" style={{ display: 'block', marginTop: 4, wordBreak: 'break-all', color: '#3b82f6' }}>
                    {result.txHash?.startsWith('0x') ? (
                      <a href={getExplorerUrl(result.txHash)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        {result.txHash}
                      </a>
                    ) : (
                      result.txHash
                    )}
                  </div>
                </div>
              </div>
            </div>

            {result.txHash?.startsWith('0x') && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <a href={getExplorerUrl(result.txHash)} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  View on Polygon Explorer <ExternalLink size={16} />
                </a>
              </div>
            )}

            {result.privateKey && result.privateKey !== 'EXTERNAL_WALLET' && (
              <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
                <AlertTriangle size={16} />
                <div>
                  <strong>CRITICAL: Private Key Generated</strong>
                  <br /><span style={{ fontSize: '0.75rem' }}>You MUST copy the Private Key and DID shown above and send them securely to the user. They will need both to log in, and the Private Key will NEVER be shown again!</span>
                </div>
              </div>
            )}

            {result.temporaryPassword && (
              <div className="alert alert-warning" style={{ marginTop: '1.5rem' }}>
                <AlertTriangle size={16} />
                <div>
                  <strong>Temporary Password:</strong> {result.temporaryPassword}
                  <br /><span style={{ fontSize: '0.75rem' }}>Share this securely with the user.</span>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Register New Identity</span>
          <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form 
          onSubmit={handleSubmit}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
              e.preventDefault();
            }
          }}
        >
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
                <input className="form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Work Email *</label>
                <input className="form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="" />
              </div>
              <div className="form-group">
                <label className="form-label">Organization</label>
                <input className="form-input" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} placeholder="Department / Company" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">MetaMask Wallet Address (Optional)</label>
                <input className="form-input" value={form.walletAddress || ''} onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))} placeholder="" />
                <span className="form-error" style={{ color: 'var(--text-muted)' }}>Paste a user's MetaMask address to link it. If left blank, a random wallet will be generated.</span>
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
              If a Wallet Address is provided, the user can log in with MetaMask. Otherwise, a random DID will be generated.
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

const IdentityDetailsModal = ({ identity, onClose }) => {
  if (!identity) return null;
  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Identity Details</span>
          <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div className="form-label">User Name</div>
              <div style={{ fontWeight: 500 }}>{identity.user?.name || 'N/A'}</div>
            </div>
            <div>
              <div className="form-label">DID</div>
              <div className="mono" style={{ fontSize: '0.875rem' }}>{identity.did}</div>
            </div>
            {identity.address && (
              <div>
                <div className="form-label">Ethereum Address</div>
                <div className="mono" style={{ fontSize: '0.875rem' }}>{identity.address}</div>
              </div>
            )}
            <div>
              <div className="form-label">Email</div>
              <div>{identity.user?.email || 'N/A'}</div>
            </div>
            <div>
              <div className="form-label">Organization</div>
              <div>{identity.user?.organization || 'N/A'}</div>
            </div>
            <div>
              <div className="form-label">Roles</div>
              <div>
                {identity.user?.userRoles?.map(ur => (
                  <span key={ur.role.name} className={`role-chip-${ur.role.name}`} style={{ marginRight: 4 }}>
                    {ur.role.displayName || ur.role.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="form-label">Status</div>
              <div><span className={`badge ${statusBadge(identity.status)}`}>{identity.status}</span></div>
            </div>
            <div>
              <div className="form-label">Created At</div>
              <div>{new Date(identity.createdAt).toLocaleString()}</div>
            </div>
            
            <div className="panel" style={{ padding: '1.25rem', marginTop: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: 600, fontSize: '1rem' }}>
                <ShieldCheck size={20} style={{ color: '#10b981' }} />
                Blockchain Proof
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <div className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Network</div>
                  <div style={{ fontWeight: 500, marginTop: 4 }}>{getExplorerNetworkName()}</div>
                </div>
                <div>
                  <div className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>Registration Transaction</div>
                  <div className="mono" style={{ marginTop: 4, wordBreak: 'break-all' }}>
                    {identity.onChainTx && identity.onChainTx.startsWith('0x') ? (
                      <a href={getExplorerUrl(identity.onChainTx)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#3b82f6' }}>
                        {identity.onChainTx}
                      </a>
                    ) : (
                      identity.onChainTx || '—'
                    )}
                  </div>
                </div>
                {identity.onChainTx && identity.onChainTx.startsWith('0x') && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href={getExplorerUrl(identity.onChainTx)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1px solid #cbd5e1' }}>
                      View on Polygon Explorer <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const ManageRolesModal = ({ identity, onClose, onUpdate }) => {
  const [loading, setLoading] = React.useState(false);
  const [newRole, setNewRole] = React.useState('manager');
  
  if (!identity || !identity.user) return null;

  const currentRoles = identity.user.userRoles || [];
  const availableRoles = ['user', 'manager', 'auditor', 'admin'].filter(
    r => !currentRoles.some(ur => ur.role.name === r)
  );

  const addRole = async () => {
    if (!newRole) return;
    setLoading(true);
    try {
      await api.post(`/users/${identity.user.id}/assign-role`, { roleName: newRole });
      await onUpdate();
      if (availableRoles.length > 1) {
        setNewRole(availableRoles.find(r => r !== newRole) || '');
      } else {
        setNewRole('');
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add role');
    } finally {
      setLoading(false);
    }
  };

  const revokeRole = async (roleName) => {
    if (!confirm(`Are you sure you want to revoke the ${roleName} role?`)) return;
    setLoading(true);
    try {
      await api.delete(`/users/${identity.user.id}/roles/${roleName}`);
      await onUpdate();
      setNewRole(roleName);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to revoke role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 500 }} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Manage Roles - {identity.user.name}</span>
          <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-label" style={{ marginBottom: 12 }}>Current Roles</div>
          {currentRoles.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>No active roles.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {currentRoles.map(ur => (
                <div key={ur.role.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span className={`role-chip-${ur.role.name}`}>{ur.role.displayName || ur.role.name}</span>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    style={{ color: 'var(--danger)', padding: '4px 8px' }}
                    onClick={() => revokeRole(ur.role.name)}
                    disabled={loading || (ur.role.name === 'admin' && currentRoles.length === 1)}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="form-label" style={{ marginBottom: 12 }}>Add Role</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-select" value={newRole} onChange={e => setNewRole(e.target.value)} disabled={loading || availableRoles.length === 0}>
              {availableRoles.length === 0 && <option value="">All roles assigned</option>}
              {availableRoles.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={addRole} disabled={loading || availableRoles.length === 0 || !newRole}>
              Add Role
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

const ActionsMenu = ({ identity, onUpdate, onView, onManageRoles }) => {
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
            { label: 'View Details', action: null, fn: () => { setOpen(false); onView(); } },
            { label: 'Manage Roles', action: null, fn: () => { setOpen(false); onManageRoles(); } },
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
  const [detailIdentity, setDetailIdentity] = React.useState(null);
  const [manageRoleIdentity, setManageRoleIdentity] = React.useState(null);
  const user = useAuthStore(s => s.user);
  const canCreate = user?.roles?.includes('admin');
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
                      <ActionsMenu identity={identity} onUpdate={fetchIdentities} onView={() => setDetailIdentity(identity)} onManageRoles={() => setManageRoleIdentity(identity)} />
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
      {detailIdentity && (
        <IdentityDetailsModal 
          identity={detailIdentity} 
          onClose={() => setDetailIdentity(null)} 
        />
      )}
      {manageRoleIdentity && (
        <ManageRolesModal
          identity={manageRoleIdentity}
          onClose={() => setManageRoleIdentity(null)}
          onUpdate={fetchIdentities}
        />
      )}
    </div>
  );
};
