import React from 'react';
import { User, Shield, Activity, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

export const Settings = () => {
  const { user, setUser } = useAuthStore();
  const isAdmin = user?.roles?.includes('admin');
  const [activeTab, setActiveTab] = React.useState('profile');
  const [systemStatus, setSystemStatus] = React.useState(null);
  const [toast, setToast] = React.useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  React.useEffect(() => {
    if (activeTab === 'system' && isAdmin) {
      api.get('/admin/system')
        .then(r => setSystemStatus(r.data.data))
        .catch(() => {});
    }
  }, [activeTab, isAdmin]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    ...(isAdmin ? [{ id: 'system', label: 'System', icon: Database }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Manage your account, security settings, and system configuration.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* Tab Sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div className="panel" style={{ padding: '0.5rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5625rem 0.75rem', borderRadius: 6, border: 'none',
                  background: activeTab === tab.id ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === tab.id ? '#60a5fa' : 'var(--text-secondary)',
                  fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                  marginBottom: 2
                }}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <ProfileTab user={user} onSave={showToast} />
          )}
          {activeTab === 'security' && (
            <SecurityTab onSave={showToast} />
          )}
          {activeTab === 'system' && isAdmin && (
            <SystemTab status={systemStatus} />
          )}
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileTab = ({ user, onSave }) => {
  const [profile, setProfile] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    organization: '',
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/users/me')
      .then(r => {
        const u = r.data.data;
        setProfile({ name: u.name || '', email: u.email || '', organization: u.organization || '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>Profile Information</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your identity and contact details.</div>
      </div>

      {loading ? (
        <div className="loading-row"><div className="loading-spinner-large" style={{ width: 24, height: 24, borderWidth: 2 }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={profile.name} onChange={e => setProfile(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Organization</label>
              <input className="form-input" value={profile.organization} onChange={e => setProfile(f => ({ ...f, organization: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" value={profile.email} disabled style={{ opacity: 0.6 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email cannot be changed.</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div className="form-label" style={{ marginBottom: '0.5rem' }}>Your Roles</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {user?.roles?.map(r => (
                <span key={r} className={`role-chip-${r}`}>{r}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => onSave('Profile saved (display only — full edit coming in v2)')}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SecurityTab = ({ onSave }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card">
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Use a strong, unique password.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" placeholder="Enter current password" />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" placeholder="Enter new password" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" placeholder="Confirm new password" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => onSave('Password change requires API integration with secure endpoint', 'info')}>
              Update Password
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Session Management
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[
            { browser: 'Current Session', device: 'Chrome — Windows', time: 'Active now', isCurrent: true },
          ].map((sess, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem', background: 'var(--bg-tertiary)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{sess.browser}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sess.device} • {sess.time}</div>
              </div>
              {sess.isCurrent ? (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Current</span>
              ) : (
                <button className="btn btn-danger btn-sm">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SystemTab = ({ status }) => {
  if (!status) {
    return (
      <div className="loading-row" style={{ minHeight: '40vh' }}>
        <div className="loading-spinner-large" />
        Loading system status...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card">
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>System Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Status', value: status.system?.status, badge: 'success' },
            { label: 'Version', value: status.system?.version },
            { label: 'Environment', value: status.system?.environment },
          ].map(({ label, value, badge }) => (
            <div key={label}>
              <div className="form-label">{label}</div>
              {badge ? (
                <span className={`badge badge-${badge}`} style={{ marginTop: 4 }}>{value}</span>
              ) : (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Blockchain Configuration</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'RPC URL', value: status.blockchain?.rpcUrl },
            { label: 'Chain ID', value: status.blockchain?.chainId },
            { label: 'Identity Registry', value: status.blockchain?.contracts?.identityRegistry },
            { label: 'Asset Registry', value: status.blockchain?.contracts?.assetRegistry },
            { label: 'Audit Registry', value: status.blockchain?.contracts?.auditRegistry },
            { label: 'Access Control', value: status.blockchain?.contracts?.accessControl },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 160, flexShrink: 0 }}>{label}</span>
              <span className="mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Platform Statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[
            { label: 'Active Users', value: status.stats?.activeUsers },
            { label: 'Active Identities', value: status.stats?.activeIdentities },
            { label: 'Total Assets', value: status.stats?.totalAssets },
            { label: 'Audit Events', value: status.stats?.totalAuditEvents },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card" style={{ padding: '0.875rem' }}>
              <div className="stat-card-label">{label}</div>
              <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{value ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
