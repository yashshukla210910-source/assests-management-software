import React from 'react';
import { ShieldCheck, Package, AlertCircle, CheckCircle, XCircle, Search, Loader } from 'lucide-react';
import api from '../utils/api';

// ─── DID Verify Panel ─────────────────────────────────────────────────────────
const DidVerifyPanel = () => {
  const [did, setDid] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!did.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const encoded = encodeURIComponent(did.trim());
      const { data } = await api.get(`/identities/${encoded}`);
      setResult({ verified: true, identity: data.data });
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ verified: false, reason: 'DID not found in the registry.' });
      } else {
        setError(err.response?.data?.error?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Verify Identity (DID)</div>
          <div className="panel-sub">Check if a decentralized identity is registered and active</div>
        </div>
        <ShieldCheck size={18} style={{ color: 'var(--text-muted)' }} />
      </div>

      <div style={{ padding: '1.25rem' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Decentralized Identifier (DID)</label>
            <input
              className="form-input"
              placeholder=""
              value={did}
              onChange={e => setDid(e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !did.trim()}>
              {loading ? <span className="spinner-sm" /> : <Search size={14} />}
              {loading ? 'Verifying...' : 'Verify Identity'}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {result && (
          <div className={`verify-result ${result.verified ? 'verified' : 'failed'}`}>
            <div className="verify-result-header">
              {result.verified ? (
                <>
                  <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--success)' }}>Identity Verified</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>This DID is registered and active</div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={20} style={{ color: 'var(--danger)' }} />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--danger)' }}>Verification Failed</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{result.reason}</div>
                  </div>
                </>
              )}
            </div>

            {result.verified && result.identity && (
              <div className="verify-result-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Identity Holder', value: result.identity.user?.name || '—' },
                    { label: 'Organization', value: result.identity.user?.organization || '—' },
                    { label: 'Email', value: result.identity.user?.email || '—' },
                    { label: 'Status', value: <span className={`badge badge-${result.identity.status === 'active' ? 'success' : 'warning'}`}>{result.identity.status}</span> },
                    { label: 'DID', value: <span className="mono" style={{ wordBreak: 'break-all', display: 'block' }}>{result.identity.did}</span> },
                    { label: 'Ethereum Address', value: <span className="mono">{result.identity.address}</span> },
                    { label: 'Chain ID', value: result.identity.chainId },
                    { label: 'Registered', value: new Date(result.identity.createdAt).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="verify-field">
                      <div className="verify-field-label">{label}</div>
                      <div className="verify-field-value">{value}</div>
                    </div>
                  ))}
                </div>
                {result.identity.onChainTx && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div className="verify-field-label" style={{ marginBottom: '0.25rem' }}>Blockchain Transaction</div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${result.identity.onChainTx}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mono"
                      style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}
                    >
                      {result.identity.onChainTx}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Asset Verify Panel ───────────────────────────────────────────────────────
const AssetVerifyPanel = () => {
  const [assetCode, setAssetCode] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!assetCode.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      if (file) {
        const formData = new FormData();
        formData.append('document', file);
        const { data } = await api.post(`/verify/asset/${assetCode.trim()}/document`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult({ verified: data.data.verified, reason: data.data.message, asset: data.data, isDocument: true });
      } else {
        const { data } = await api.get(`/verify/asset/${assetCode.trim()}`);
        setResult({ verified: data.data.blockchain?.hashMatch !== false, asset: data.data, isDocument: false });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ verified: false, reason: 'Asset not found in the registry.' });
      } else {
        setError(err.response?.data?.error?.message || 'Verification failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Verify Asset</div>
          <div className="panel-sub">Check asset ownership and metadata integrity on blockchain</div>
        </div>
        <Package size={18} style={{ color: 'var(--text-muted)' }} />
      </div>

      <div style={{ padding: '1.25rem' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Asset Code</label>
            <input
              className="form-input"
              placeholder="e.g. ASSET-001"
              value={assetCode}
              onChange={e => setAssetCode(e.target.value.toUpperCase())}
              disabled={loading}
            />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Physical Document (Optional)</label>
            <input
              type="file"
              className="form-input"
              onChange={e => setFile(e.target.files[0])}
              disabled={loading}
              style={{ padding: '0.3rem' }}
            />
          </div>
          <div style={{ display: 'flex' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || !assetCode.trim()}>
              {loading ? <span className="spinner-sm" /> : <Search size={14} />}
              {loading ? 'Verifying...' : 'Verify Asset'}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {result && (
          <div className={`verify-result ${result.verified ? 'verified' : 'failed'}`}>
            <div className="verify-result-header">
              {result.verified ? (
                <>
                  <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--success)' }}>{result.isDocument ? 'Document Verified' : 'Asset Verified'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{result.reason || 'Metadata integrity confirmed'}</div>
                  </div>
                </>
              ) : (
                <>
                  <XCircle size={20} style={{ color: 'var(--danger)' }} />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--danger)' }}>Verification Failed</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{result.reason || 'Hash mismatch detected'}</div>
                  </div>
                </>
              )}
            </div>

            {result.asset && !result.isDocument && (
              <div className="verify-result-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: 'Asset Code', value: result.asset.assetCode },
                    { label: 'Asset Name', value: result.asset.name },
                    { label: 'Category', value: result.asset.category },
                    { label: 'Status', value: <span className={`badge badge-${result.asset.status === 'assigned' ? 'success' : 'neutral'}`}>{result.asset.status}</span> },
                    { label: 'Current Owner DID', value: <span className="mono" style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block' }}>{result.asset.currentOwner?.did || '—'}</span> },
                    { label: 'Owner Name', value: result.asset.currentOwner?.name || '—' },
                    { label: 'Token ID', value: result.asset.blockchain?.tokenId || '—' },
                    { label: 'Metadata Integrity', value: <span className={`badge badge-${result.asset.blockchain?.hashMatch ? 'success' : 'danger'}`}>{result.asset.blockchain?.hashMatch ? 'Valid' : 'Mismatch'}</span> },
                    { label: 'Verified At', value: new Date(result.asset.verifiedAt).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="verify-field">
                      <div className="verify-field-label">{label}</div>
                      <div className="verify-field-value">{value}</div>
                    </div>
                  ))}
                </div>
                {result.asset.blockchain?.mintTxHash && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div className="verify-field-label" style={{ marginBottom: '0.25rem' }}>Mint Transaction</div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${result.asset.blockchain.mintTxHash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="mono"
                      style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}
                    >
                      {result.asset.blockchain.mintTxHash}
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {result.asset && result.isDocument && (
              <div className="verify-result-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="verify-field">
                    <div className="verify-field-label">Asset Code</div>
                    <div className="verify-field-value">{result.asset.assetCode}</div>
                  </div>
                  <div className="verify-field">
                    <div className="verify-field-label">Asset Name</div>
                    <div className="verify-field-value">{result.asset.name}</div>
                  </div>
                  <div className="verify-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="verify-field-label">Calculated Document Hash</div>
                    <div className="verify-field-value mono" style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{result.asset.calculatedHash}</div>
                  </div>
                  <div className="verify-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="verify-field-label">Stored Blockchain Hash</div>
                    <div className="verify-field-value mono" style={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>{result.asset.storedHash}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Verification Page ────────────────────────────────────────────────────────
export const Verification = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
    <div className="page-header">
      <div>
        <h1 className="page-title">Verification</h1>
        <p className="page-sub">Verify decentralized identities and asset integrity on the Sepolia blockchain.</p>
      </div>
    </div>
    <DidVerifyPanel />
    <AssetVerifyPanel />
  </div>
);
