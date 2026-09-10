import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-indigo-400/20 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-cyan-300/20 blur-[120px]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-white/60 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 overflow-hidden bg-slate-900">
              <img src="/surakshavault-logo.jpg" alt="SurakshaVault Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">
              Suraksha<span className="text-blue-600">Vault</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Platform</a>
            <span className="cursor-not-allowed hover:text-blue-600 transition-colors">Security</span>
            <span className="cursor-not-allowed hover:text-blue-600 transition-colors">Compliance</span>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="relative group overflow-hidden rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-xl transition-all duration-300">
              <span className="relative z-10 flex items-center gap-2">
                Sign In
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-20">
        
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-16 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 text-sm font-semibold mb-8 backdrop-blur-sm shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Enterprise Mainnet is Live
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              The Future of <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Asset Tokenization
              </span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
              Institutional-grade digital asset infrastructure combining W3C Decentralized Identity, Hardware Security Modules, and zero-knowledge privacy for the modern enterprise.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/login" className="w-full sm:w-auto rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5">
                Access Dashboard
              </Link>
              <a href="#features" className="w-full sm:w-auto rounded-full bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
                Explore Platform
              </a>
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            {/* Glass Card 1 */}
            <div className="relative z-20 bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-2xl shadow-slate-200/50 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Verified Identity</p>
                    <p className="text-xs font-medium text-slate-500">did:ion:EiD...c842b</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100">
                  ATTESTED
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Asset Class</span>
                  <span className="text-sm font-bold text-slate-900">Real Estate (CRE)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Tokenized Value</span>
                  <span className="text-sm font-bold text-blue-600">$45,000,000.00</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Quorum Status</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Glass Card 2 (Background) */}
            <div className="absolute top-10 right-[-20px] lg:right-[-40px] z-10 w-full bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-xl transform rotate-[4deg] scale-95 opacity-80 pointer-events-none">
               <div className="h-48 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100"></div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white/70 backdrop-blur-lg border border-slate-100 rounded-3xl p-8 lg:p-12 shadow-sm flex flex-wrap justify-between items-center gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            <div className="flex-1 text-center min-w-[200px] pt-4 lg:pt-0">
              <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">$14.2B+</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Assets Tokenized</p>
            </div>
            <div className="flex-1 text-center min-w-[200px] pt-4 lg:pt-0">
              <p className="text-4xl font-extrabold text-blue-600 mb-2 tracking-tight">99.999%</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">System Uptime</p>
            </div>
            <div className="flex-1 text-center min-w-[200px] pt-4 lg:pt-0">
              <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">SOC2</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Type II Certified</p>
            </div>
            <div className="flex-1 text-center min-w-[200px] pt-4 lg:pt-0">
              <p className="text-4xl font-extrabold text-blue-600 mb-2 tracking-tight">&lt;12ms</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Finality Latency</p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Engineered for Institutions</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              SurakshaVault provides the cryptographic guarantees required by regulators without sacrificing the performance needed for high-frequency operations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">W3C Decentralized Identity</h3>
              <p className="text-slate-600 leading-relaxed">
                Self-sovereign identity management using DID:ION. Eliminate centralized honeypots with true cryptographic proof of identity.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Hardware-Backed RBAC</h3>
              <p className="text-slate-600 leading-relaxed">
                Granular hierarchical permissions enforced by HSMs. M-of-N multi-sig policies ensure no single point of failure in operations.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Immutable Audit Trails</h3>
              <p className="text-slate-600 leading-relaxed">
                Real-time Merkle tree proof verification. Continuous RFC 3161 compliant logging ensures perfect SOC2 compliance out of the box.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">SurakshaVault</span>
          </div>
          <p className="text-sm">© 2024 SurakshaVault Institutional Systems Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-medium">
            <span className="cursor-not-allowed hover:text-white transition-colors">Privacy</span>
            <span className="cursor-not-allowed hover:text-white transition-colors">Terms</span>
            <span className="cursor-not-allowed hover:text-white transition-colors">System Status</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export { LandingPage };
