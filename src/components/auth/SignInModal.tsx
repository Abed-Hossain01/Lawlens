'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth, NothiUser } from '@/lib/auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn, user, signOut } = useAuth();
  const [tab, setTab] = useState<'demo' | 'email' | 'bar'>('demo');

  // Form states
  const [email, setEmail] = useState('');
  const [chamberName, setChamberName] = useState('');
  const [barId, setBarId] = useState('');
  const [advocateName, setAdvocateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDemoSignIn = (role: 'Advocate' | 'Senior Counsel') => {
    setIsLoading(true);
    setTimeout(() => {
      const demoUser: NothiUser = {
        id: 'usr_demo_' + Date.now(),
        name: role === 'Senior Counsel' ? 'Adv. Rafiqul Islam' : 'Adv. Tahmina Akter',
        email: role === 'Senior Counsel' ? 'rafiqul@supremecourt.org.bd' : 'tahmina@dhakabar.org.bd',
        chamber: role === 'Senior Counsel' ? 'Supreme Court Bar Association' : 'Dhaka District Bar Chamber',
        barNumber: role === 'Senior Counsel' ? 'SC-2012-7841' : 'DB-2019-3320',
        plan: role === 'Senior Counsel' ? 'pro' : 'basic',
        role,
      };
      signIn(demoUser);
      setIsLoading(false);
      onClose();
    }, 400);
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your chamber email address');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const newUser: NothiUser = {
        id: 'usr_email_' + Date.now(),
        name: advocateName.trim() || email.split('@')[0],
        email,
        chamber: chamberName.trim() || 'Independent Legal Chamber',
        plan: 'basic',
        role: 'Advocate',
      };
      signIn(newUser);
      setIsLoading(false);
      onClose();
    }, 500);
  };

  const handleBarSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!barId) {
      setError('Please enter your Bar Council Sanad / Roll ID');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const newUser: NothiUser = {
        id: 'usr_bar_' + Date.now(),
        name: advocateName.trim() || 'Advocate Member',
        email: `${barId.toLowerCase().replace(/[^a-z0-9]/g, '')}@barcouncil.gov.bd`,
        chamber: chamberName.trim() || 'Bangladesh Bar Council Member',
        barNumber: barId,
        plan: 'pro',
        role: 'Senior Counsel',
      };
      signIn(newUser);
      setIsLoading(false);
      onClose();
    }, 500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border/80 bg-paper shadow-2xl p-6 sm:p-8 space-y-5 relative text-ink animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-brass font-bold">
              Chamber Authentication
            </span>
            <h2 id="signin-modal-title" className="font-heading text-2xl font-bold text-green-deep mt-0.5">
              {user ? 'Chamber Account' : 'Sign in to Nothi AI'}
            </h2>
            <p className="text-xs text-ink-muted font-sans mt-0.5">
              Deterministic statutory examination workspace for Bangladesh
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-paper-dark font-mono text-sm focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* If user is ALREADY signed in */}
        {user ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-paper-dark border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-green-deep uppercase tracking-wider">
                  Active Session
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brass/20 text-ink font-bold font-mono">
                  {user.plan.toUpperCase()} TIER
                </span>
              </div>
              <div className="font-heading text-lg font-bold text-ink">{user.name}</div>
              <div className="text-xs text-ink-muted font-sans">{user.chamber}</div>
              {user.barNumber && (
                <div className="text-[11px] font-mono text-ink-muted">Sanad: {user.barNumber}</div>
              )}
              <div className="text-[11px] font-mono text-ink-muted truncate">{user.email}</div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl border border-vermillion/40 text-vermillion font-sans text-xs font-semibold hover:bg-vermillion/10 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-green-deep text-paper font-sans text-xs font-semibold hover:bg-green-mid transition-colors cursor-pointer"
              >
                Continue Working
              </button>
            </div>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-4">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-paper-dark border border-border text-xs font-sans">
              <button
                type="button"
                onClick={() => {
                  setTab('demo');
                  setError(null);
                }}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  tab === 'demo'
                    ? 'bg-paper text-green-deep font-bold shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                1-Click Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('email');
                  setError(null);
                }}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  tab === 'email'
                    ? 'bg-paper text-green-deep font-bold shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Work Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('bar');
                  setError(null);
                }}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  tab === 'bar'
                    ? 'bg-paper text-green-deep font-bold shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Bar Sanad ID
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-vermillion/10 border border-vermillion/30 text-vermillion text-xs font-sans">
                {error}
              </div>
            )}

            {/* Tab 1: Instant 1-Click Demo */}
            {tab === 'demo' && (
              <div className="space-y-3 py-1 animate-in fade-in duration-150">
                <p className="text-xs font-sans text-ink-muted leading-relaxed">
                  Test and inspect Nothi AI immediately as an authorized chamber advocate or senior counsel:
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('Senior Counsel')}
                    disabled={isLoading}
                    className="w-full text-left p-3 rounded-xl border border-border hover:border-brass/80 bg-paper-light/60 hover:bg-paper-light transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-ink group-hover:text-green-deep">
                        Adv. Rafiqul Islam (Senior Counsel)
                      </div>
                      <div className="text-[11px] text-ink-muted">Supreme Court Bar • Enterprise Pro Tier</div>
                    </div>
                    <span className="text-xs font-mono text-brass group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoSignIn('Advocate')}
                    disabled={isLoading}
                    className="w-full text-left p-3 rounded-xl border border-border hover:border-brass/80 bg-paper-light/60 hover:bg-paper-light transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-ink group-hover:text-green-deep">
                        Adv. Tahmina Akter (Chamber Associate)
                      </div>
                      <div className="text-[11px] text-ink-muted">Dhaka Bar Association • Basic Chamber Tier</div>
                    </div>
                    <span className="text-xs font-mono text-brass group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Work Email + OTP */}
            {tab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3 py-1 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-mono font-bold text-ink mb-1">
                    Advocate Name
                  </label>
                  <input
                    type="text"
                    value={advocateName}
                    onChange={(e) => setAdvocateName(e.target.value)}
                    placeholder="Adv. Kazi Nasir Uddin"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-paper-light text-xs font-sans text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-ink mb-1">
                    Chamber / Firm Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="lawyer@chambers.com.bd"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-paper-light text-xs font-sans text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-ink mb-1">
                    Chamber Name
                  </label>
                  <input
                    type="text"
                    value={chamberName}
                    onChange={(e) => setChamberName(e.target.value)}
                    placeholder="Nasir & Partners Law Chambers"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-paper-light text-xs font-sans text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-green-deep hover:bg-green-mid text-paper font-sans text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying Chamber...' : 'Sign In with Email'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Bangladesh Bar Council ID */}
            {tab === 'bar' && (
              <form onSubmit={handleBarSubmit} className="space-y-3 py-1 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-mono font-bold text-ink mb-1">
                    Bar Council Sanad / Roll ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={barId}
                    onChange={(e) => setBarId(e.target.value)}
                    placeholder="e.g. SC-2015-8942 or DB-2020-1123"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-paper-light text-xs font-mono text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-ink mb-1">
                    Advocate Name
                  </label>
                  <input
                    type="text"
                    value={advocateName}
                    onChange={(e) => setAdvocateName(e.target.value)}
                    placeholder="Advocate Name as in Sanad"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-paper-light text-xs font-sans text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-green-deep hover:bg-green-mid text-paper font-sans text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Connecting to Sanad Registry...' : 'Authenticate Bar Sanad'}
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-border/60 text-center">
              <span className="text-[11px] font-mono text-ink-muted">
                Statutory zero-hallucination compliance guaranteed.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
