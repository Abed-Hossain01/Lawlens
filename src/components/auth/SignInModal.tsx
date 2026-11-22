'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth, NothiUser } from '@/lib/auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn, user, signOut } = useAuth();

  // Simple form states (only name and email required)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const newUser: NothiUser = {
        id: 'usr_' + Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        chamber: 'Chamber Counsel',
        plan: 'basic',
        role: 'Advocate',
      };
      signIn(newUser);
      setIsLoading(false);
      onClose();
    }, 350);
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
        className="w-full max-w-md rounded-2xl border border-border/80 bg-paper shadow-2xl p-6 sm:p-8 space-y-6 relative text-ink animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-brass font-bold">
              Account Authentication
            </span>
            <h2 id="signin-modal-title" className="font-heading text-2xl font-bold text-green-deep mt-0.5">
              {user ? 'Account Profile' : 'Sign in to Nothi AI'}
            </h2>
            <p className="text-xs text-ink-muted font-sans mt-0.5">
              {user ? 'You are currently signed in.' : 'Enter your name and email to access your workspace.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-paper-dark font-mono text-sm focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── ALREADY SIGNED IN: PROFILE & LOGOUT ── */}
        {user ? (
          <div className="space-y-5 py-1">
            <div className="p-4 rounded-xl bg-paper-dark/60 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-green-deep uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Signed In
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brass/20 text-ink font-bold font-mono uppercase">
                  {user.plan} tier
                </span>
              </div>
              <div className="font-heading text-xl font-bold text-ink">{user.name}</div>
              <div className="text-xs font-mono text-ink-muted">{user.email}</div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  signOut();
                }}
                className="flex-1 py-2.5 rounded-xl border border-vermillion/40 text-vermillion hover:bg-vermillion/10 font-sans text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Sign Out / Logout</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-green-deep text-paper hover:bg-green-mid font-sans text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── SIGN IN FORM (ONLY NAME AND EMAIL) ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-xl bg-vermillion/10 border border-vermillion/30 text-vermillion text-xs font-sans">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-bold text-ink mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adv. Rafiqul Islam"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-paper-light text-sm font-sans text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden transition-all placeholder:text-ink-muted/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-ink mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rafiqul@chamber.com.bd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-paper-light text-sm font-sans text-ink focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden transition-all placeholder:text-ink-muted/50"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-green-deep hover:bg-green-mid text-paper font-sans text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In / Login →'}
              </button>
            </div>

            <p className="text-center text-[11px] font-sans text-ink-muted pt-1">
              Deterministic statutory examination for deeds, khatians and NIDs.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
