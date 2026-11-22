'use client';

import { useState } from 'react';
import type { CorpusSection } from '@/types';

export interface SlipItem {
  id: string;
  act: string;
  section: string;
  title: string;
  status: 'pending' | 'checking' | 'verified' | 'stripped';
  corpusRecord?: CorpusSection;
}

interface CitationGate2DProps {
  slips: SlipItem[];
  isRunning: boolean;
  onRunCheck: () => void;
  onReset: () => void;
  onSelectSlip: (slip: SlipItem) => void;
  logEntries: { id: string; time: string; reason: string }[];
  verifiedCount: number;
  strippedCount: number;
}

export function CitationGate2D({
  slips,
  isRunning,
  onRunCheck,
  onReset,
  onSelectSlip,
  logEntries,
  verifiedCount,
  strippedCount,
}: CitationGate2DProps) {
  const [hoveredSlipId, setHoveredSlipId] = useState<string | null>(null);

  const hasRun = slips.some((s) => s.status === 'verified' || s.status === 'stripped');

  return (
    <div className="w-full rounded-sm border-2 border-border bg-paper p-5 sm:p-6 shadow-md space-y-6">
      {/* 2D Gate Header / Counter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-brass animate-pulse" />
          <span className="font-heading font-bold text-sm text-green-deep">
            The Citation Gate • Statutory Checkpoint
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-green-deep/10 text-green-deep border border-green-deep/20">
            <span className="font-bold">✓ Verified:</span>
            <span>{verifiedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-vermillion/10 text-vermillion border border-vermillion/20">
            <span className="font-bold">▲ Stripped:</span>
            <span>{strippedCount}</span>
          </div>
        </div>
      </div>

      {/* Slips Display Column */}
      <div className="space-y-3" role="list" aria-label="Citation slips under verification">
        {slips.map((slip) => {
          const isVerified = slip.status === 'verified';
          const isStripped = slip.status === 'stripped';
          const isChecking = slip.status === 'checking';
          const isHovered = hoveredSlipId === slip.id;

          return (
            <div
              key={slip.id}
              role="listitem"
              onMouseEnter={() => setHoveredSlipId(slip.id)}
              onMouseLeave={() => setHoveredSlipId(null)}
              onClick={() => (isVerified ? onSelectSlip(slip) : undefined)}
              className={`relative rounded-xs border transition-all duration-200 p-3.5 sm:p-4 select-none ${
                isVerified
                  ? 'border-green-deep/40 bg-surface shadow-xs cursor-pointer hover:border-green-deep hover:shadow-sm'
                  : isStripped
                  ? 'border-vermillion/40 bg-vermillion/5 opacity-75'
                  : isChecking
                  ? 'border-brass bg-brass/10 ring-2 ring-brass/40 animate-pulse'
                  : 'border-border bg-paper-light hover:border-brass/70 hover:shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">
                      {slip.id}
                    </span>
                    {isVerified && (
                      <span className="text-[10px] font-mono text-green-mid uppercase">
                        (Corpus Linked)
                      </span>
                    )}
                  </div>
                  <div className="font-heading text-sm text-ink-muted">
                    {slip.section ? `${slip.section} • ` : ''}{slip.title}
                  </div>
                  {isHovered && slip.act && (
                    <div className="text-xs text-ink-muted/80 font-sans italic pt-0.5">
                      Statutory Source: {slip.act}
                    </div>
                  )}
                </div>

                {/* Stamp Badges (Visible ONLY after checking) */}
                <div className="shrink-0 flex items-center gap-2">
                  {slip.status === 'pending' && (
                    <span className="px-2.5 py-1 rounded-xs bg-paper-dark/60 text-ink-muted font-mono text-[11px] border border-border/80">
                      Unchecked Slip
                    </span>
                  )}
                  {isChecking && (
                    <span className="px-2.5 py-1 rounded-xs bg-brass/20 text-brass-light font-mono text-[11px] font-bold border border-brass/40 animate-pulse">
                      Scanning Gate...
                    </span>
                  )}
                  {isVerified && (
                    <div className="px-3 py-1 rounded-xs bg-green-deep text-paper font-mono text-xs font-bold tracking-wider shadow-xs flex items-center gap-1.5 border border-green-light/40">
                      <span>✓</span>
                      <span>VERIFIED</span>
                    </div>
                  )}
                  {isStripped && (
                    <div className="px-3 py-1 rounded-xs bg-vermillion text-paper font-mono text-xs font-bold tracking-wider shadow-xs flex items-center gap-1.5">
                      <span>▲</span>
                      <span>NOT IN CORPUS</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shredded effect for stripped slip */}
              {isStripped && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-vermillion/40 text-[11px] font-mono text-vermillion flex items-center justify-between">
                  <span>[SHREDDED] Sliced and discarded into brass bin</span>
                  <span className="opacity-80">Reason: Not in laws_corpus.json</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
        {!hasRun ? (
          <button
            type="button"
            disabled={isRunning}
            onClick={onRunCheck}
            className="px-5 py-2.5 rounded-xs bg-green-deep text-paper hover:bg-green-mid font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:outline-hidden active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Processing Slips...' : '▶ Check these citations'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xs border border-border bg-paper hover:bg-paper-dark font-mono text-xs font-bold text-ink transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer"
          >
            ↺ Run again
          </button>
        )}

        <div className="text-xs font-mono text-ink-muted">
          {hasRun ? (
            <span className="text-green-deep font-bold">
              ✓ Gate Complete: {verifiedCount} preserved, {strippedCount} discarded
            </span>
          ) : (
            <span>Ready for registry gate inspection</span>
          )}
        </div>
      </div>

      {/* Ledger Register Output */}
      {logEntries.length > 0 && (
        <div className="rounded-xs border border-border bg-paper-dark/50 p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-bold">
            Registry Discard Ledger
          </div>
          {logEntries.map((log, idx) => (
            <div key={idx} className="font-mono text-xs text-vermillion flex flex-wrap items-center gap-2">
              <span className="text-ink-muted">[{log.time}]</span>
              <span className="font-bold">{log.id}</span>
              <span className="text-ink-muted">&rarr;</span>
              <span>{log.reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
