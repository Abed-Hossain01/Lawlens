'use client';

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useLang } from '@/lib/lang';
import { CitationGate2D, SlipItem } from './CitationGate2D';
import { DrawerDetailModal } from './DrawerDetailModal';
import type { CorpusSection } from '@/types';
import {
  resolveCanonicalId,
  getCorpusSectionById,
  isValidCitationId,
} from '@/lib/citations';

// Lazy-load the Three.js 3D Canvas
const CitationGateCanvas = dynamic(
  () => import('./CitationGateCanvas').then((mod) => mod.CitationGateCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[560px] rounded-sm bg-desk-dark border-2 border-border flex flex-col items-center justify-center p-8 text-paper-dark animate-pulse">
        <div className="w-12 h-12 rounded-full border-2 border-brass border-t-transparent animate-spin mb-4" />
        <span className="font-heading text-lg font-bold text-brass-light">
          Mounting The Citation Gate...
        </span>
        <span className="text-xs font-mono text-ink-muted mt-1">
          Loading 28-section statutory corpus cabinet
        </span>
      </div>
    ),
  }
);

const INITIAL_SLIPS: SlipItem[] = [
  {
    id: 'reg_1908_sec23',
    act: 'Registration Act, 1908',
    section: 'Section 23',
    title: 'Time for presenting documents',
    status: 'pending',
  },
  {
    id: 'tp_1882_sec52',
    act: 'Transfer of Property Act, 1882',
    section: 'Section 52',
    title: 'Transfer of property pending suit',
    status: 'pending',
  },
  {
    id: 'reg_1908_sec999_fake_clause',
    act: 'Registration Act, 1908',
    section: 'Section 999',
    title: 'Fabricated Hallucination',
    status: 'pending',
  },
  {
    id: 'land_crime_2023_sec4',
    act: 'Land Crime Prevention & Remedy Act, 2023',
    section: 'Section 4',
    title: 'Penalties for forged deeds',
    status: 'pending',
  },
];

// React 19 external store subscribers for SSR-safe media queries
function subscribeMediaQuery(query: string) {
  return (callback: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };
}

const subscribeReducedMotion = subscribeMediaQuery('(prefers-reduced-motion: reduce)');
const subscribeMobile = subscribeMediaQuery('(max-width: 767px)');
const getReducedMotionSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getMobileSnapshot = () => window.innerWidth < 768;
const getServerFalse = () => false;

export function CitationGateSection() {
  const { lang } = useLang();
  const prefersReducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getServerFalse);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getServerFalse);

  // Slips state
  const [slips, setSlips] = useState<SlipItem[]>(() =>
    INITIAL_SLIPS.map((s) => ({ ...s }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [strippedCount, setStrippedCount] = useState(0);

  // Interactive UI state
  const [hoveredSlipId, setHoveredSlipId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<{
    section: CorpusSection | null;
    id: string | null;
  } | null>(null);
  const [customIdInput, setCustomIdInput] = useState('');
  const [logEntries, setLogEntries] = useState<{ id: string; time: string; reason: string }[]>([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  // IntersectionObserver for lazy mounting
  const sectionRef = useRef<HTMLElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsNearViewport(true);
        }
      },
      { rootMargin: '250px' }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Handlers
  const handleRunCheck = () => {
    if (isRunning) return;
    setIsRunning(true);
    setLiveAnnouncement('Starting citation verification through the statutory gate.');

    // For 2D fallback, sequentially process with state updates
    if (isMobile || prefersReducedMotion) {
      let idx = 0;
      let vCount = 0;
      let sCount = 0;

      const timer = setInterval(() => {
        if (idx >= slips.length) {
          clearInterval(timer);
          setIsRunning(false);
          setHasRun(true);
          setVerifiedCount(vCount);
          setStrippedCount(sCount);
          setLiveAnnouncement(`Verification complete: ${vCount} verified, ${sCount} stripped.`);
          return;
        }

        const currentSlip = slips[idx];
        const canonical = resolveCanonicalId(currentSlip.id);
        const isValid = isValidCitationId(canonical);

        setSlips((prev) =>
          prev.map((s, i) => {
            if (i === idx) {
              return { ...s, status: isValid ? 'verified' : 'stripped' };
            }
            return s;
          })
        );

        if (isValid) {
          vCount++;
          setVerifiedCount(vCount);
          setLiveAnnouncement(`${currentSlip.id} verified: exists in laws_corpus.json.`);
        } else {
          sCount++;
          setStrippedCount(sCount);
          const time = new Date().toLocaleTimeString();
          setLogEntries((prev) => [
            { id: currentSlip.id, time, reason: 'not found in laws_corpus.json' },
            ...prev,
          ]);
          setLiveAnnouncement(`${currentSlip.id} removed: not found in laws_corpus.json.`);
        }

        idx++;
      }, 750);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasRun(false);
    setVerifiedCount(0);
    setStrippedCount(0);
    setSlips(INITIAL_SLIPS.map((s) => ({ ...s, status: 'pending' })));
    setLogEntries([]);
    setLiveAnnouncement('Citation gate reset. Slips returned to input tray.');
  };

  const handle3DSequenceComplete = useCallback((vCount: number, sCount: number) => {
    setIsRunning(false);
    setHasRun(true);
    setVerifiedCount(vCount);
    setStrippedCount(sCount);
    setLiveAnnouncement(`Verification sequence complete: ${vCount} verified, ${sCount} stripped.`);
  }, []);

  const handleLogEntry = useCallback((id: string, reason: string) => {
    const time = new Date().toLocaleTimeString();
    setLogEntries((prev) => [{ id, time, reason }, ...prev]);
  }, []);

  const handleAnnounce = useCallback((msg: string) => {
    setLiveAnnouncement(msg);
  }, []);

  const handleAddCustomSlip = (idToAdd: string) => {
    const trimmed = idToAdd.trim();
    if (!trimmed) return;
    if (slips.some((s) => s.id === trimmed)) {
      setLiveAnnouncement(`Slip with ID ${trimmed} already exists.`);
      return;
    }

    const canonical = resolveCanonicalId(trimmed);
    const corpusSection = getCorpusSectionById(canonical);

    const newSlip: SlipItem = {
      id: trimmed,
      act: corpusSection?.act || 'Custom Statutory Query',
      section: corpusSection?.section || 'Query Section',
      title: corpusSection?.title || (corpusSection ? 'Verified Section' : 'Unregistered Input ID'),
      status: 'pending',
      corpusRecord: corpusSection,
    };

    setSlips((prev) => [...prev, newSlip]);
    setCustomIdInput('');
    setLiveAnnouncement(`Added citation slip for ${trimmed}. Ready to check.`);
  };

  const handleSelectSlip = (slip: SlipItem) => {
    const canonical = resolveCanonicalId(slip.id);
    const record = getCorpusSectionById(canonical) || slip.corpusRecord || null;
    setSelectedRecord({ section: record, id: slip.id });
  };

  const use3D = isNearViewport && !isMobile && !prefersReducedMotion;

  return (
    <section
      id="citations"
      ref={sectionRef}
      className="py-20 sm:py-24 border-b border-border bg-paper-light scroll-mt-24"
      aria-labelledby="citations-heading"
    >
      {/* Invisible Screen Reader Announcement Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* ── LEFT COLUMN: COPY & INTERACTIVE CONTROLS (MAX 480PX) ── */}
          <div className="lg:col-span-5 space-y-6 max-w-lg">
            {/* Plain sentence-case label */}
            <div className="text-xs font-mono tracking-wider text-green-mid">
              Citation integrity
            </div>

            {/* Sensibly wrapped heading */}
            <h2
              id="citations-heading"
              className="font-heading text-3xl sm:text-4xl font-bold text-green-deep leading-tight max-w-md"
            >
              {lang === 'bn'
                ? 'উদ্ধৃতি নির্ভরযোগ্যতা ও সংবিধিবদ্ধ গেট'
                : 'Why Citations Can Be Trusted'}
            </h2>

            {/* Tightened descriptive copy */}
            <div className="space-y-3 text-sm text-ink-muted font-sans leading-relaxed">
              <p>
                In property title vetting, fabricated statutory citations create fatal legal liabilities.
                LawLens enforces an uncompromising gatekeeper: every generated finding must resolve against
                our authoritative statutory corpus (<code className="font-mono text-xs bg-paper-dark px-1.5 py-0.5 rounded-xs text-ink font-semibold">laws_corpus.json</code>).
              </p>
              <p>
                Any citation ID not present in the verified corpus is deterministically stripped and logged
                before rendering, guaranteeing that every warning shown to a lawyer corresponds to true Bangladeshi law.
              </p>
            </div>

            {/* Corpus Stats Badge */}
            <div className="pt-1 flex items-center gap-3 text-xs font-mono text-ink-muted">
              <span className="inline-flex items-center gap-1.5 text-green-deep font-bold">
                <span className="w-2 h-2 rounded-full bg-green-mid" />
                Verified Corpus: 28 Sections
              </span>
              <span>•</span>
              <span>4 Acts</span>
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {!hasRun ? (
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={handleRunCheck}
                  className="px-5 py-2.5 rounded-xs bg-green-deep text-paper hover:bg-green-mid font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isRunning ? 'Checking through gate...' : 'Check these citations'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xs border border-border bg-paper hover:bg-paper-dark font-mono text-xs font-bold text-ink transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden cursor-pointer"
                >
                  ↺ Run again
                </button>
              )}

              {/* Counters */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-1 rounded-xs bg-green-deep/10 text-green-deep border border-green-deep/20 font-bold">
                  {verifiedCount} Verified
                </span>
                <span className="px-2 py-1 rounded-xs bg-vermillion/10 text-vermillion border border-vermillion/20 font-bold">
                  {strippedCount} Stripped
                </span>
              </div>
            </div>

            {/* "Try your own ID" Interactive Input */}
            <div className="pt-4 border-t border-border space-y-2">
              <label htmlFor="custom-citation-input" className="block text-xs font-mono font-bold text-ink">
                Try your own ID:
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddCustomSlip(customIdInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  id="custom-citation-input"
                  type="text"
                  value={customIdInput}
                  onChange={(e) => setCustomIdInput(e.target.value)}
                  placeholder="e.g. tpa_1882_s54"
                  className="flex-1 px-3 py-1.5 rounded-xs border border-border bg-paper text-xs font-mono text-ink placeholder:text-ink-muted/50 focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xs bg-paper-dark hover:bg-border text-ink font-mono text-xs font-semibold border border-border transition-colors cursor-pointer"
                >
                  Add Slip
                </button>
              </form>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono">
                <span className="text-ink-muted">Quick test:</span>
                <button
                  type="button"
                  onClick={() => handleAddCustomSlip('tpa_1882_s54')}
                  className="text-green-deep hover:underline font-bold cursor-pointer"
                >
                  Try a real ID
                </button>
                <span className="text-border">•</span>
                <button
                  type="button"
                  onClick={() => handleAddCustomSlip('nid_rule_99_fabricated')}
                  className="text-vermillion hover:underline font-bold cursor-pointer"
                >
                  Try a made-up ID
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: 3D THE CITATION GATE SCENE (560PX TALL) ── */}
          <div className="lg:col-span-7">
            <div className="w-full h-[520px] sm:h-[560px] rounded-sm border-2 border-border bg-desk-dark shadow-xl overflow-hidden relative">
              {use3D ? (
                <CitationGateCanvas
                  slips={slips}
                  isRunning={isRunning}
                  onSequenceComplete={handle3DSequenceComplete}
                  onSelectSlip={handleSelectSlip}
                  onLogEntry={handleLogEntry}
                  onAnnounce={handleAnnounce}
                  hoveredSlipId={hoveredSlipId}
                  setHoveredSlipId={setHoveredSlipId}
                />
              ) : (
                <div className="w-full h-full overflow-y-auto p-4 sm:p-6 bg-paper">
                  <CitationGate2D
                    slips={slips}
                    isRunning={isRunning}
                    onRunCheck={handleRunCheck}
                    onReset={handleReset}
                    onSelectSlip={handleSelectSlip}
                    logEntries={logEntries}
                    verifiedCount={verifiedCount}
                    strippedCount={strippedCount}
                  />
                </div>
              )}

              {/* Live Overlay Ledger Plate in 3D Mode */}
              {use3D && logEntries.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xs bg-paper/95 border border-brass text-[11px] font-mono text-vermillion shadow-md flex items-center justify-between pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                  <span className="font-bold">▲ DISCARD LEDGER:</span>
                  <span>[{logEntries[0].time}] {logEntries[0].id} &rarr; {logEntries[0].reason}</span>
                </div>
              )}
            </div>

            {/* Required one-line caption under the scene */}
            <p className="mt-3 text-center text-xs text-ink-muted font-sans">
              Every citation is checked against the verified corpus before it is shown.
            </p>
          </div>
        </div>
      </div>

      {/* Drawer Record Close-Up Modal */}
      <DrawerDetailModal
        section={selectedRecord?.section || null}
        citationId={selectedRecord?.id || null}
        onClose={() => setSelectedRecord(null)}
      />
    </section>
  );
}
