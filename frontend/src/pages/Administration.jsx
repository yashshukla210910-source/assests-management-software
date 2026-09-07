import React from 'react';
import { Server, Database, Wifi, RefreshCw, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const CopyButton = ({ value }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={handleCopy} className="btn btn-ghost btn-icon btn-sm" title="Copy">
      {copied ? <CheckCircle size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
    </button>
  );
};

export const Administration = () => {
  const [system, setSystem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchSystem = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/system');
      setSystem(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load system information.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchSystem(); }, []);

  const serviceStatus = [
    { label: 'Backend API', status: system ? 'operational' : 'unknown', detail: `v${system?.system?.version || '—'}` },
    { label: 'Database', status: system ? 'operational' : 'unknown', detail: 'PostgreSQL' },
    { label: 'Blockchain RPC', status: system?.blockchain ? 'operational' : 'unknown', detail: 'Ethereum Sepolia' },
    { label: 'Identity Registry', status: system?.blockchain?.contracts?.identityRegistry ? 'operational' : 'degraded', detail: system?.blockchain?.contracts?.identityRegistry?.slice(0, 16) + '…' || '—' },
    { label: 'Asset Registry', status: system?.blockchain?.contracts?.assetRegistry ? 'operational' : 'degraded', detail: system?.blockchain?.contracts?.assetRegistry?.slice(0, 16) + '…' || '—' },
    { label: 'Access Control', status: system?.blockchain?.contracts?.accessControl ? 'operational' : 'degraded', detail: system?.blockchain?.contracts?.accessControl?.slice(0, 16) + '…' || '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Administration</h1>
          <p className="page-sub">System health, blockchain configuration, and infrastructure status.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchSystem} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-row"><div className="loading-spinner-large" />Loading system status...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <>
          {/* Service Health */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Service Health</div>
                <div className="panel-sub">Current operational status of all services</div>
              </div>
              <Server size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ padding: '0.875rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.625rem' }}>
              {serviceStatus.map(svc => (
                <div key={svc.label} className="system-status-item">
                  <div>
                    <div className="system-status-label">{svc.label}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>{svc.detail}</div>
                  </div>
                  <span className={`status-dot ${svc.status}`}>
                    {svc.status === 'operational' ? 'Operational' :
                     svc.status === 'degraded' ? 'Degraded' : 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain Config */}
          {system?.blockchain && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Blockchain Configuration</div>
                  <div className="panel-sub">Network and smart contract details</div>
                </div>
                <Wifi size={15} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ padding: '1rem 1.25rem' }}>
                <div className="kv-list">
                  <div className="kv-item">
                    <div className="kv-key">Network</div>
                    <div className="kv-value">Ethereum Sepolia (Chain ID: {system.blockchain.chainId})</div>
                  </div>
                  <div className="kv-item">
                    <div className="kv-key">RPC Endpoint</div>
                    <div className="kv-value" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ wordBreak: 'break-all' }}>{system.blockchain.rpcUrl?.replace(/\/v2\/.*/, '/v2/***')}</span>
                    </div>
                  </div>
                  {[
                    { label: 'Identity Registry', addr: system.blockchain.contracts?.identityRegistry },
                    { label: 'Asset Registry', addr: system.blockchain.contracts?.assetRegistry },
                    { label: 'Access Control', addr: system.blockchain.contracts?.accessControl },
                    { label: 'Audit Registry', addr: system.blockchain.contracts?.auditRegistry },
                  ].map(({ label, addr }) => addr && (
                    <div key={label} className="kv-item">
                      <div className="kv-key">{label}</div>
                      <div className="kv-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="mono" style={{ fontSize: '0.78rem' }}>{addr}</span>
                        <CopyButton value={addr} />
                        <a href={`https://sepolia.etherscan.io/address/${addr}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-ghost btn-icon btn-sm" title="View on Etherscan">
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* System Stats */}
          {system?.stats && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Platform Statistics</div>
              </div>
              <div style={{ padding: '1rem 1.25rem' }}>
                <div className="kv-list">
                  {[
                    { label: 'Active Users', value: system.stats.activeUsers },
                    { label: 'Active Identities (DIDs)', value: system.stats.activeIdentities },
                    { label: 'Total Assets', value: system.stats.totalAssets },
                    { label: 'Total Audit Events', value: system.stats.totalAuditEvents },
                    { label: 'Environment', value: system.system?.environment || '—' },
                    { label: 'Platform Version', value: system.system?.version || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="kv-item">
                      <div className="kv-key">{label}</div>
                      <div className="kv-value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
