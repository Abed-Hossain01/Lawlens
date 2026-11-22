'use client';

export function Footer() {

  return (
    <footer className="border-t border-border bg-paper-dark no-print">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 sm:px-8 lg:px-12 py-6">
        <p className="text-xs text-ink-muted font-sans">
          LawLens v1.0, Team Boron, Pointfex
        </p>
        <p className="text-xs text-ink-muted font-mono">
          Bangladesh Legal Vetting System • Deterministic Engine
        </p>
      </div>
    </footer>
  );
}
