'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/lang';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';
import { SignInModal } from '@/components/auth/SignInModal';

const subscribeReducedMotion = (callback: () => void) => {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
};
const getReducedMotionSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getReducedMotionServerSnapshot = () => false;

export function Header() {
  const { lang, setLang } = useLang();
  const { user } = useAuth();
  const pathname = usePathname();

  const isHome = pathname === '/';

  // Scroll & auth states
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [activeSection, setActiveSection] = useState<'home' | 'explore' | 'who-its-for' | 'citations' | 'pricing'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const lastScrollY = useRef(0);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Scroll listener for: 24px solid transition, auto-hide on scroll down, and scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Transparent vs Solid threshold (24px)
      setIsScrolled(currentScrollY > 24);

      // 2. Auto-hide on scroll down and reappear on scroll up (only on landing page, below hero)
      if (isHome) {
        if (currentScrollY <= 24) {
          setIsVisible(true);
        } else if (currentScrollY > lastScrollY.current && currentScrollY > 600) {
          // Scrolling down past initial hero: hide header
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up: reveal header
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;

      // 3. Scroll-spy for landing page
      if (isHome) {
        const sections: Array<'pricing' | 'citations' | 'who-its-for' | 'explore'> = [
          'pricing',
          'citations',
          'who-its-for',
          'explore',
        ];
        let found = false;
        for (const id of sections) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // If top is within upper third of viewport
            if (rect.top <= 200 && rect.bottom >= 100) {
              setActiveSection(id);
              found = true;
              break;
            }
          }
        }
        if (!found && currentScrollY < 500) {
          setActiveSection('home');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  // Lock body scroll and trap focus when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
          menuButtonRef.current?.focus();
        } else if (e.key === 'Tab' && mobileMenuRef.current) {
          const focusable = mobileMenuRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Nav link definitions (Modern Business Product)
  const navLinks = [
    { id: 'explore', labelEn: 'Explore', labelBn: 'অনুসন্ধান', href: isHome ? '#explore' : '/#explore' },
    { id: 'who-its-for', labelEn: 'Who it’s for', labelBn: 'কার জন্য', href: isHome ? '#who-its-for' : '/#who-its-for' },
    { id: 'citations', labelEn: 'Citations', labelBn: 'আইনি ধারা', href: isHome ? '#citations' : '/#citations' },
    { id: 'pricing', labelEn: 'Plans', labelBn: 'পরিকল্পনা', href: isHome ? '#pricing' : '/pricing' },
    { id: 'chat', labelEn: 'AI Assistant', labelBn: 'এআই সহকারী', href: '/chat' },
  ];

  // If on dedicated /chat page, Header is suppressed in favor of the chat page's single authoritative header
  if (pathname === '/chat') {
    return null;
  }

  return (
    <>
      {/* ── ACCESSIBILITY: SKIP TO MAIN CONTENT LINK ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-6 focus:z-[100] focus:px-4 focus:py-2 focus:bg-green-deep focus:text-paper focus:font-sans focus:text-sm focus:font-semibold focus:rounded-xs focus:ring-2 focus:ring-brass focus:shadow-xl focus:outline-hidden"
      >
        Skip to main content
      </a>

      {/* ── STICKY SITE HEADER (72PX DESKTOP, 60PX MOBILE) ── */}
      <header
        className={`sticky top-0 z-50 w-full select-none transition-all duration-200 ${isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
          } ${isScrolled
            ? 'bg-paper/90 backdrop-blur-xl border-b border-border/80 text-ink shadow-[0_4px_20px_-4px_rgba(27,67,50,0.06)]'
            : 'bg-paper/80 backdrop-blur-md border-b border-border/60 text-ink shadow-2xs'
          }`}
      >
        <div className="mx-auto flex h-[60px] md:h-[70px] max-w-[1280px] items-center justify-between px-6 sm:px-8 lg:px-12">

          {/* ── LEFT: ORIGINAL LOGO + WORDMARK ── */}
          <Link
            href="/"
            className="group flex items-center no-underline focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden rounded-xs transition-transform hover:scale-[1.01]"
            aria-label="Nothi AI Home"
          >
            <Logo />
          </Link>

          {/* ── CENTER: DESKTOP NAVIGATION LINKS ── */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-1.5 lg:gap-2 px-3 py-1 rounded-full bg-paper-dark/40 border border-border/50"
          >
            {navLinks.map((link) => {
              const isActive = isHome && activeSection === link.id;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-3.5 py-1.5 text-xs lg:text-[13px] font-medium font-sans rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden ${isActive
                    ? 'bg-green-deep text-paper font-semibold shadow-xs'
                    : 'text-ink-muted hover:text-ink hover:bg-paper-dark/70'
                    }`}
                >
                  {lang === 'bn' ? link.labelBn : link.labelEn}
                </Link>
              );
            })}
          </nav>

          {/* ── RIGHT CONTROLS: LANGUAGE SWITCH & "EXPLORE NOTHI AI →" ── */}
          <div className="flex items-center gap-3 sm:gap-3.5">

            {/* Compact Two-Segment Language Switch "EN | বাং" */}
            <div
              role="radiogroup"
              aria-label="Select interface language"
              className="inline-flex p-0.5 rounded-full border border-border bg-paper-dark/70 transition-colors shadow-2xs"
            >
              <button
                type="button"
                role="radio"
                aria-checked={lang === 'en'}
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full text-xs font-sans transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer ${lang === 'en'
                  ? 'bg-green-deep text-paper font-bold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
                  }`}
                title="Switch interface to English"
              >
                EN
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={lang === 'bn'}
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-full text-xs font-bangla transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer ${lang === 'bn'
                  ? 'bg-green-deep text-paper font-bold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
                  }`}
                title="ইন্টারফেস বাংলায় পরিবর্তন করুন"
              >
                বাং
              </button>
            </div>

            {/* Sign in Option (Right side) */}
            {user ? (
              <button
                type="button"
                onClick={() => setSignInModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-paper-dark/70 hover:bg-paper-dark text-ink font-sans text-xs font-semibold transition-all shadow-2xs hover:border-brass/60 cursor-pointer"
                title={`Signed in as ${user.name} (${user.chamber})`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="max-w-[110px] truncate">{user.name.replace('Advocate ', 'Adv. ')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSignInModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-paper hover:bg-paper-dark text-ink font-sans text-xs font-semibold transition-all shadow-2xs hover:border-brass/70 cursor-pointer"
                title="Sign in to your chamber account"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>{lang === 'bn' ? 'লগইন' : 'Sign in'}</span>
              </button>
            )}

            {/* Primary Filled Button: "Explore Nothi AI →" */}
            <Link
              href="/chat"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden cursor-pointer bg-green-deep text-paper hover:bg-green-mid group"
            >
              <span>{lang === 'bn' ? 'নথি এআই দেখুন' : 'Explore Nothi AI'}</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            {/* Mobile Hamburger Menu Button (<768px) */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden p-2 rounded-xs border border-border text-ink hover:bg-paper-dark transition-colors focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* ── MOBILE FULL-WIDTH DROPDOWN MENU PANEL (<768PX) ── */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
            className={`fixed inset-x-0 top-[60px] bottom-0 bg-paper text-ink z-50 p-6 flex flex-col justify-between overflow-y-auto border-t border-border shadow-2xl ${reducedMotion ? '' : 'animate-in slide-in-from-top-4 duration-200'
              }`}
          >
            {/* Nav list */}
            <div className="space-y-6 pt-2">
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link) => {
                  const isActive = isHome && activeSection === link.id;
                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-heading font-medium transition-colors py-1 flex items-center justify-between border-b border-border/40 ${isActive ? 'text-green-deep font-bold' : 'text-ink-muted hover:text-ink'
                        }`}
                    >
                      <span>{lang === 'bn' ? link.labelBn : link.labelEn}</span>
                      {isActive && <span className="text-xs font-mono text-brass">Active</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Primary Button */}
            <div className="pt-6 border-t border-border space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignInModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-border bg-paper-dark text-ink font-sans text-xs font-semibold hover:bg-border transition-colors cursor-pointer"
              >
                <span>{user ? `Signed in as ${user.name}` : (lang === 'bn' ? 'চেম্বার লগইন (Sign in)' : 'Chamber Sign In')}</span>
              </button>

              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-green-deep text-paper font-sans text-sm font-semibold hover:bg-green-mid shadow-md"
              >
                <span>{lang === 'bn' ? 'নথি এআই দেখুন →' : 'Explore Nothi AI →'}</span>
              </Link>

              <p className="text-center text-xs text-ink-muted font-sans">
                Team Boron • Pointfex Land Intelligence
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Chamber Sign In Modal */}
      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
      />
    </>
  );
}
