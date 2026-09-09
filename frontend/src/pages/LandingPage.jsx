import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col w-full selection:bg-surface-container-highest selection:text-primary">
      {/* TOP APP BAR */}
      <header className="sticky top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant shadow-sm">
        <div className="flex justify-between items-center w-full max-w-[1600px] mx-auto px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2.5" className="shadow-xs">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <span className="text-headline-md font-headline-md text-primary font-bold tracking-tight">DecentraVault</span>
            <div className="hidden sm:flex items-center gap-1 ml-3 px-2 py-0.5 bg-surface-container-low border border-outline-variant rounded text-label-sm font-label-sm text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>ENTERPRISE CORE</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-primary font-semibold border-b-2 border-primary pb-1 font-label-lg text-label-lg transition-all duration-150 ease-in-out" href="#solutions">Solutions</a>
            <a className="text-on-surface-variant hover:text-primary font-medium transition-colors font-label-lg text-label-lg" href="#infrastructure">Infrastructure</a>
            <a className="text-on-surface-variant hover:text-primary font-medium transition-colors font-label-lg text-label-lg" href="#governance">Governance</a>
            <a className="text-on-surface-variant hover:text-primary font-medium transition-colors font-label-lg text-label-lg" href="#security">Security</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-on-surface font-label-lg text-label-lg px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors">
              Sign In
            </Link>
            <a className="flex items-center gap-1.5 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-4 py-2 rounded-lg transition-all shadow-sm" href="#request-demo">
              <span>Request Demo</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center">
        {/* HERO SECTION */}
        <section className="w-full relative border-b border-outline-variant bg-surface-container-lowest grid-bg-subtle overflow-hidden">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col items-start space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f766e] text-label-sm font-label-sm shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#0d9488]"></span>
                  <span className="tracking-wide">INSTITUTIONAL GRADE DIGITAL ASSET INFRASTRUCTURE • SOC2 TYPE II & FIPS 140-2</span>
                </div>
                <h1 className="text-display-lg-mobile lg:text-display-lg font-display-lg text-on-surface tracking-tight leading-tight">
                  Next-Generation <br className="hidden sm:inline"/>Asset Tokenization
                </h1>
                <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                  Unify real-world institutional assets with verifiable decentralized identity, multi-party computation security, and immutable auditability at enterprise scale.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
                  <a className="w-full sm:w-auto text-center px-6 py-3.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2" href="#pilot">
                    <span>Start Enterprise Pilot</span>
                  </a>
                  <a className="w-full sm:w-auto text-center px-6 py-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant font-label-lg text-label-lg transition-colors flex items-center justify-center gap-2" href="#architecture">
                    <span className="text-primary font-bold mr-1">#</span>
                    <span>Explore Architecture</span>
                  </a>
                </div>
                <div className="pt-8 w-full border-t border-outline-variant">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-headline-lg font-headline-lg text-primary font-bold">$14.2B+</span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Assets Tokenized</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-headline-lg font-headline-lg text-primary font-bold">99.999%</span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Fault Tolerance</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-headline-lg font-headline-lg text-secondary font-bold">0</span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Security Breaches</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-headline-lg font-headline-lg text-primary font-bold">&lt;12ms</span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Finality Latency</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-full max-w-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-2 shadow-md">
                  <div className="relative rounded-lg overflow-hidden border border-outline-variant bg-surface">
                    <div className="h-9 px-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                        <span className="text-code-sm font-code-sm text-tertiary ml-2">vault-node-us-east-1a::active</span>
                      </div>
                      <span className="text-code-sm font-code-sm text-secondary flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                        HSM SYNCED
                      </span>
                    </div>
                    <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-surface-container">
                      <img className="w-full h-full object-cover object-center" alt="Architecture" src="/login-hero.jpg"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-90"></div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 space-y-2">
                      <div className="p-3 bg-surface-container-lowest/95 backdrop-blur-md rounded-lg border border-outline-variant shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-primary font-bold">!</div>
                          <div>
                            <div className="text-label-md font-label-md text-on-surface font-semibold">Hardware HSM Quorum Enforced</div>
                            <div className="text-code-sm font-code-sm text-on-surface-variant">FIPS 140-2 Level 3 • 4/5 Cosigners</div>
                          </div>
                        </div>
                        <span className="text-label-sm font-label-sm text-[#0f766e] bg-[#f0fdfa] border border-[#ccfbf1] px-2 py-0.5 rounded">
                          VERIFIED
                        </span>
                      </div>
                      <div className="p-3 bg-surface-container-lowest/95 backdrop-blur-md rounded-lg border border-outline-variant shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-secondary font-bold">@</div>
                          <div>
                            <div className="text-label-md font-label-md text-on-surface font-semibold">DID:ion Resolution Active</div>
                            <div className="text-code-sm font-code-sm text-tertiary">did:ion:EiD...c842b109e</div>
                          </div>
                        </div>
                        <span className="text-code-sm font-code-sm text-primary font-medium">Real-Time Merkle Proof</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES SECTION */}
        <section className="w-full py-20 bg-surface border-b border-outline-variant" id="solutions">
          <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mb-16">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-primary text-label-sm font-label-sm mb-3">
                <span className="text-sm font-bold">#</span>
                <span>MODULAR CRYPTOGRAPHIC SUBSYSTEMS</span>
              </div>
              <h2 className="text-headline-xl lg:text-headline-xl font-headline-xl text-on-surface tracking-tight">
                Enterprise-Grade Security & Identity Architecture
              </h2>
              <p className="text-body-lg font-body-lg text-on-surface-variant mt-2">
                Engineered specifically to satisfy strict global regulatory expectations without compromising transaction velocity or custody sovereign control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 lg:p-8 flex flex-col justify-between shadow-sm hover:border-primary transition-all duration-200">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary mb-6 font-bold text-xl">1</div>
                  <h3 className="text-headline-md font-headline-md text-on-surface mb-3">W3C Decentralized Identifiers</h3>
                  <p className="text-body-md font-body-md text-on-surface-variant mb-6 leading-relaxed">
                    Self-sovereign cryptographic identity management, zero-knowledge verifiable credentials, and multi-tenant KMS integration eliminating centralized honeypots.
                  </p>
                  <div className="bg-surface p-3.5 rounded-lg border border-outline-variant space-y-2">
                    <div className="flex items-center justify-between text-code-sm font-code-sm">
                      <span className="text-tertiary">Schema:</span>
                      <span className="text-on-surface font-semibold">w3c:verifiable-cred:v2.0</span>
                    </div>
                    <div className="flex items-center justify-between text-code-sm font-code-sm">
                      <span className="text-tertiary">Identity Resolver:</span>
                      <span className="text-secondary font-semibold">Decentralized DHT Sync</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 lg:p-8 flex flex-col justify-between shadow-sm hover:border-primary transition-all duration-200">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary mb-6 font-bold text-xl">2</div>
                  <h3 className="text-headline-md font-headline-md text-on-surface mb-3">Role-Based Access Control</h3>
                  <p className="text-body-md font-body-md text-on-surface-variant mb-6 leading-relaxed">
                    Granular hierarchical permissions, hardware token FIDO2/WebAuthn gating, automated quorum approvals, and emergency circuit breakers.
                  </p>
                  <div className="bg-surface p-3.5 rounded-lg border border-outline-variant space-y-2">
                    <div className="flex items-center justify-between text-code-sm font-code-sm">
                      <span className="text-tertiary">Auth Standard:</span>
                      <span className="text-on-surface font-semibold">FIDO2 / WebAuthn Level 2</span>
                    </div>
                    <div className="flex items-center justify-between text-code-sm font-code-sm">
                      <span className="text-tertiary">Quorum Logic:</span>
                      <span className="text-secondary font-semibold">M-of-N Multi-Sig Policy</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 lg:p-8 flex flex-col justify-between shadow-sm hover:border-primary transition-all duration-200">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary mb-6 font-bold text-xl">3</div>
                  <h3 className="text-headline-md font-headline-md text-on-surface mb-3">Blockchain Audit Trail</h3>
                  <p className="text-body-md font-body-md text-on-surface-variant mb-6 leading-relaxed">
                    Immutable, cryptographically timestamped transaction ledger, automated SOC2 compliance logging, and real-time Merkle tree proof verification.
                  </p>
                  <div className="bg-surface p-3.5 rounded-lg border border-outline-variant space-y-2">
                    <div className="flex items-center justify-between text-code-sm font-code-sm">
                      <span className="text-tertiary">Proof Hash:</span>
                      <span className="text-on-surface font-semibold font-code-sm">SHA-256 / Blake3</span>
                    </div>
                    <div className="flex items-center justify-between text-code-sm font-code-sm">
                      <span className="text-tertiary">Auditor Export:</span>
                      <span className="text-primary font-semibold">Continuous RFC 3161</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant">
        <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-body-sm font-body-sm text-on-surface-variant text-center sm:text-left">
              © 2024 DecentraVault Institutional Systems Inc. FIPS 140-2 Level 3 & SOC2 Type II Certified. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-body-sm font-body-sm text-on-surface-variant">
              <span className="hover:text-primary transition-colors cursor-pointer">System Status: Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export { LandingPage };
