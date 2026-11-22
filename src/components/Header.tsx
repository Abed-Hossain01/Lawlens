'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/lib/lang';
import { Logo } from './Logo';

const subscribeReducedMotion = (callback: () => void) => {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
};
const getReducedMotionSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getReducedMotionServerSnapshot = () => false;

export function Header() {
  const { lang, setLang } = useLang();
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isChat = pathname === '/chat';

  // Scroll states
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
    { id: 'pricing', labelEn: 'Pricing', labelBn: 'মূল্যতালিকা', href: isHome ? '#pricing' : '/pricing' },
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
        className={`sticky top-0 z-50 w-full select-none transition-all ${
          reducedMotion ? 'duration-0' : 'duration-200 ease-out'
        } ${
          isVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        } ${
          isChat
            ? 'bg-paper border-b border-border-light text-ink shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
            : isScrolled
            ? 'bg-paper/95 backdrop-blur-md border-b border-border-light text-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
            : 'bg-paper/90 backdrop-blur-md border-b border-border-light/80 text-ink shadow-xs'
        }`}
      >
        <div className="mx-auto flex h-[60px] md:h-[72px] max-w-[1280px] items-center justify-between px-6 sm:px-8 lg:px-12">

          {/* ── LEFT: ORIGINAL LOGO + WORDMARK ── */}
          <Link
            href="/"
            className="group flex items-center no-underline focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden rounded-xs"
            aria-label="Nothi AI Home"
          >
            <Logo />
          </Link>

          {/* ── CENTER: DESKTOP NAVIGATION LINKS (SANS 15PX, 24PX GAP, BLACK/GREEN) ── */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6"
          >
            {navLinks.map((link) => {
              const isActive = isHome && activeSection === link.id;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-1 text-[15px] font-medium font-sans transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden rounded-xs ${
                    isActive
                      ? 'text-green-deep font-bold'
                      : 'text-ink hover:text-green-deep'
                  } after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-brass transition-all ${
                    reducedMotion ? '' : 'after:transition-all after:duration-200'
                  } ${
                    isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                  }`}
                >
                  {lang === 'bn' ? link.labelBn : link.labelEn}
                </Link>
              );
            })}
          </nav>

          {/* ── RIGHT CONTROLS: MINIMAL LANGUAGE SWITCH & AUDIT CTA ── */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* Compact Two-Segment Language Switch "EN | বাং" */}
            <div
              role="radiogroup"
              aria-label="Select interface language"
              className="inline-flex p-0.5 rounded-xs border border-border bg-paper-dark/60 transition-colors"
            >
              <button
                type="button"
                role="radio"
                aria-checked={lang === 'en'}
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-[2px] text-xs font-sans transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer ${
                  lang === 'en'
                    ? 'bg-green-deep text-paper font-bold shadow-xs'
                    : 'text-ink hover:text-green-deep'
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
                className={`px-2 py-1 rounded-[2px] text-xs font-bangla transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-green-deep text-paper font-bold shadow-xs'
                    : 'text-ink hover:text-green-deep'
                }`}
                title="ইন্টারফেস বাংলায় পরিবর্তন করুন"
              >
                বাং
              </button>
            </div>

            {/* Primary Filled Button: "Explore Nothi AI →" */}
            <Link
              href="/chat"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xs font-sans text-sm font-semibold transition-all duration-150 shadow-sm focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-95 cursor-pointer bg-green-deep text-paper hover:bg-green-mid"
            >
              <span>{lang === 'bn' ? 'অনুসন্ধান করুন →' : 'Explore Assistant →'}</span>
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
            className={`fixed inset-x-0 top-[60px] bottom-0 bg-paper text-ink z-50 p-6 flex flex-col justify-between overflow-y-auto border-t border-border shadow-2xl ${
              reducedMotion ? '' : 'animate-in slide-in-from-top-4 duration-200'
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
                      className={`text-lg font-heading font-medium transition-colors py-1 flex items-center justify-between border-b border-border/40 ${
                        isActive ? 'text-green-deep font-bold' : 'text-ink-muted hover:text-ink'
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
              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xs bg-green-deep text-paper font-sans text-sm font-semibold hover:bg-green-mid shadow-md"
              >
                <span>{lang === 'bn' ? 'অনুসন্ধান করুন →' : 'Explore Assistant →'}</span>
              </Link>

              <p className="text-center text-xs text-ink-muted font-sans">
                Team Boron • Pointfex Land Intelligence
              </p>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
