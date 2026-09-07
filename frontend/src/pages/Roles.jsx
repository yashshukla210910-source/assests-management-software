import React from 'react';
import { Shield, RefreshCw, X, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

const roleColors = {
  admin: { bg: 'rgba(37,99,235,0.08)', color: '#1d4ed8', border: 'rgba(37,99,235,0.2)' },
  manager: { bg: 'rgba(22,163,74,0.08)', color: '#15803d', border: 'rgba(22,163,74,0.2)' },
  auditor: { bg: 'rgba(217,119,6,0.08)', color: '#b45309', border: 'rgba(217,119,6,0.2)' },
  user: { bg: 'rgba(100,116,139,0.08)', color: '#475569', border: 'rgba(100,116,139,0.2)' },
};

const domainColors = {
  identity: '#2563eb',
  asset: '#16a34a',
  role: '#7c3aed',
  audit: '#d97706',
  notification: '#0891b2',
  admin: '#dc2626',
};

const RoleCard = ({ role, isAdmin, onUpdate }) => {
  const [expanded, setExpanded] = React.useState(false);
  const colors = roleColors[role.name] || roleColors.user;

  const permsByDomain = {};
  role.permissions?.forEach(p => {
    if (!permsByDomain[p.domain]) permsByDomain[p.domain] = [];
    permsByDomain[p.domain].push(p);
  });

  return (
    <div className="card" style={{ transition: 'border-color 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.color
          }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{role.displayName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {role.activeUsersCount} active user{role.activeUsersCount !== 1 ? 's' : ''}
              {role.isSystem && <span style={{ marginLeft: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.1rem 0.375rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>SYSTEM</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span
            style={{
              background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
              borderRadius: '9999px', padding: '0.15rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase'
            }}
          >
            {role.name}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {role.permissions?.filter(p => p.granted).length || 0} permissions granted across {Object.keys(permsByDomain).length} domains
      </div>

      <button
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'inherit', padding: 0
        }}
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Hide' : 'View'} Permissions
      </button>

      {expanded && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(permsByDomain).map(([domain, perms]) => (
            <div key={domain}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: domainColors[domain] || 'var(--text-muted)', marginBottom: '0.375rem',
                paddingBottom: '0.25rem', borderBottom: `1px solid ${domainColors[domain] || 'var(--border)'}30`
              }}>
                {domain}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {perms.map(p => (
                  <div key={p.key} style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    background: p.granted ? 'var(--success-bg)' : 'var(--bg-tertiary)',
                    border: `1px solid ${p.granted ? 'var(--success-border)' : 'var(--border)'}`,
                    borderRadius: '9999px', padding: '0.2rem 0.625rem', fontSize: '0.7rem',
                    color: p.granted ? 'var(--success)' : 'var(--text-muted)'
                  }}>
                    {p.granted && <CheckCircle size={10} />}
                    {p.key.replace(`${domain}.`, '')}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {role.permissions?.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {role.name === 'admin' ? 'Admin has unrestricted access to all system functions.' : 'No specific permissions configured.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AssignRoleModal = ({ onClose, onSuccess }) => {
  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [selectedUser, setSelectedUser] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/roles')
    ]).then(([u, r]) => {
      setUsers(u.data.data || []);
      setRoles(r.data.data || []);
    }).catch(() => {});
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const role = roles.find(r => r.id === selectedRole);
      await api.post(`/users/${selectedUser}/assign-role`, { roleName: role?.name });
      setDone(true);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to assign role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Assign Role to User</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {done ? (
          <>
            <div className="modal-body">
              <div className="alert alert-success"><CheckCircle size={16} /> Role assigned successfully!</div>
            </div>
            <div className="modal-footer"><button className="btn btn-primary" onClick={onClose}>Done</button></div>
          </>
        ) : (
          <form onSubmit={handleAssign}>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Select User *</label>
                <select className="form-select" required value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">Choose a user...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Role *</label>
                <select className="form-select" required value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                  <option value="">Choose a role...</option>
                  {roles.filter(r => r.name !== 'admin').map(r => (
                    <option key={r.id} value={r.id}>{r.displayName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading || !selectedUser || !selectedRole}>
                {loading && <span className="spinner-sm" />}
                Assign Role
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const Roles = () => {
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showAssign, setShowAssign] = React.useState(false);
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.roles?.includes('admin');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/roles');
      setRoles(data.data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchRoles(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Access Control</h1>
          <p className="page-sub">Role-based permissions enforced at API and smart-contract level.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost btn-icon" onClick={fetchRoles} title="Refresh"><RefreshCw size={15} /></button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAssign(true)}>
              <Shield size={15} />
              Assign Role
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-row" style={{ minHeight: '40vh' }}>
          <div className="loading-spinner-large" />
          Loading roles...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {roles.map(role => (
              <RoleCard key={role.id} role={role} isAdmin={isAdmin} onUpdate={fetchRoles} />
            ))}
          </div>

          <div className="panel" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              RBAC Security Model
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div>• Permissions enforced at backend API layer</div>
              <div>• Admin role bypasses permission checks</div>
              <div>• Role assignments recorded in audit log</div>
              <div>• Smart contract access controlled by DVAccessControl</div>
              <div>• Permission changes require admin privileges</div>
              <div>• JWT tokens encode role assignments</div>
            </div>
          </div>
        </>
      )}

      {showAssign && <AssignRoleModal onClose={() => setShowAssign(false)} onSuccess={fetchRoles} />}
    </div>
  );
};
