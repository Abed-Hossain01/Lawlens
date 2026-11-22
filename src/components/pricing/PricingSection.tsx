'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PLANS, COMPARISON_TABLE, PlanConfig } from '@/config/plans';
import { ContactModal } from './ContactModal';

export function PricingSection({ showFaq = true }: { showFaq?: boolean }) {
  const [isYearly, setIsYearly] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    plan: 'plus' | 'pro' | 'demo';
  }>({
    isOpen: false,
    plan: 'plus',
  });

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const FAQ_ITEMS = [
    {
      q: 'Which documents are supported in Phase 1?',
      a: 'Phase 1 deterministically vets the primary Bangladeshi property conveyance triad: Saf Kabala deeds (সাফ কবলা), Collectorate RS and BS Khatian ledgers (আরএস ও বিএস খতিয়ান), and National ID smart cards (জাতীয় পরিচয়পত্র). PDF, JPG, and PNG formats up to 15 MB per document are supported.',
    },
    {
      q: 'How is statutory accuracy protected against AI hallucination?',
      a: 'Nothi AI enforces a zero-fabrication invariant (SRS FR-4.2, NFR-1). Findings and chat explanations must resolve against our verified legal corpus (laws_corpus.json, 28 sections across 4 Acts). Any citation ID not present in the verified corpus is deterministically stripped and logged before rendering.',
    },
    {
      q: 'What can the Nothi AI chat answer, and what can it not?',
      a: 'The assistant explains statutory rules governing deed registration deadlines (Section 23, Registration Act 1908), plot/Dag identification (Transfer of Property Act 1882), Khatian title chain records, and NID format requirements. It will refuse to answer or fabricate rules for unverified topics outside the statutory corpus.',
    },
    {
      q: 'Does Nothi AI replace a licensed advocate?',
      a: 'No. Nothi AI is a deterministic statutory vetting assistant designed for legal vetting officers, advocates, and bank compliance teams. It performs mathematical parity and statutory checks, but does not render legal advice or replace formal title clearance opinions by an advocate.',
    },
    {
      q: 'How are sensitive property deeds and National ID numbers handled?',
      a: 'Uploaded files are processed in ephemeral memory and automatically purged after audit completion. National ID numbers are normalized strictly in-session to verify 10-digit or 13/17-digit format and are never stored or logged in plain text.',
    },
    {
      q: 'How does billing and invoicing work for chambers and banks?',
      a: 'Subscriptions are billed in Bangladeshi Taka (BDT) on either a monthly or annual basis (with a 20% annual discount). Enterprise Pro plans include formal bank VAT/AIT invoicing and institutional purchase orders.',
    },
  ];

  return (
    <section id="pricing" className="py-24 border-b border-border bg-paper-light scroll-mt-24">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass/15 border border-brass/30 text-xs font-mono font-bold text-ink">
            <span>Transparent Chamber Tiers</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-green-deep tracking-tight">
            Plans for chambers, banks and developers
          </h2>

          <p className="text-sm sm:text-base text-ink-muted font-sans max-w-xl mx-auto leading-relaxed">
            Deterministic statutory vetting tailored for independent advocates, corporate law firms, and commercial loan syndicates.
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={`text-xs font-mono font-semibold ${!isYearly ? 'text-ink' : 'text-ink-muted'}`}>
              Monthly
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={isYearly}
              onClick={() => setIsYearly(!isYearly)}
              aria-label="Toggle annual billing discount"
              className="relative w-12 h-6 rounded-full bg-paper-dark border border-border p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full bg-green-deep transition-transform duration-200 ${
                  isYearly ? 'translate-x-6 bg-brass' : 'translate-x-0'
                }`}
              />
            </button>

            <span className={`text-xs font-mono font-semibold ${isYearly ? 'text-green-deep' : 'text-ink-muted'}`}>
              Yearly <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brass/20 text-ink font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        {/* ── 3 PRICING CARDS (CLEAR HIERARCHY) ── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan: PlanConfig) => {
            const isRec = plan.recommended;
            const price = isYearly ? plan.priceYearlyBdt : plan.priceMonthlyBdt;

            return (
              <div
                key={plan.id}
                className={`relative rounded-sm transition-all duration-200 flex flex-col justify-between ${
                  isRec
                    ? 'bg-green-deep text-paper shadow-2xl border-2 border-brass lg:-translate-y-3 z-10 p-7 sm:p-8'
                    : 'bg-paper text-ink shadow-md border-2 border-border p-6 sm:p-7'
                }`}
              >
                {/* "Most chosen" Pill */}
                {isRec && plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brass text-ink font-mono text-[10px] font-black uppercase tracking-widest shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-5">
                  {/* Plan Name & Tagline */}
                  <div>
                    <h3 className={`font-heading text-2xl font-bold ${isRec ? 'text-paper' : 'text-green-deep'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mt-1.5 font-sans leading-relaxed ${isRec ? 'text-paper-dark' : 'text-ink-muted'}`}>
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Pricing Display */}
                  <div className="pt-2 border-t border-current/15">
                    {price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-xs opacity-75">BDT</span>
                        <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight">
                          ৳{price.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono opacity-70">
                          {isYearly ? '/ yr' : '/ mo'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading text-3xl font-bold">Custom Quote</span>
                        <span className="text-xs font-mono opacity-70">/ institutional</span>
                      </div>
                    )}
                  </div>

                  {/* Feature Inclusions List */}
                  <div className="pt-4 space-y-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-75 font-bold block">
                      Included Capabilities:
                    </span>
                    <ul className="space-y-2 text-xs font-sans">
                      {plan.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          {feat.included ? (
                            <span className={`shrink-0 font-bold ${isRec ? 'text-brass-light' : 'text-green-deep'}`}>
                              ✓
                            </span>
                          ) : feat.planned ? (
                            <span className="shrink-0 px-1 py-0.2 rounded-2xs bg-brass/25 text-brass-light font-mono text-[9px] font-bold">
                              Planned
                            </span>
                          ) : (
                            <span className="shrink-0 opacity-30 text-ink-muted">✕</span>
                          )}

                          <span className={feat.included ? '' : feat.planned ? 'opacity-85 italic' : 'opacity-40 line-through'}>
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Primary Button */}
                <div className="pt-8">
                  {plan.ctaType === 'audit' ? (
                    <Link
                      href="/audit"
                      className="w-full py-3 rounded-xs bg-paper-dark hover:bg-border text-ink font-sans text-xs font-bold uppercase tracking-wider text-center block transition-colors border border-border shadow-xs cursor-pointer"
                    >
                      {plan.ctaText} &rarr;
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setModalState({
                          isOpen: true,
                          plan: plan.id as 'plus' | 'pro',
                        })
                      }
                      className={`w-full py-3 rounded-xs font-sans text-xs font-bold uppercase tracking-wider text-center block transition-all shadow-md active:scale-95 cursor-pointer ${
                        isRec
                          ? 'bg-brass text-ink hover:bg-brass-light'
                          : 'bg-green-deep text-paper hover:bg-green-mid'
                      }`}
                    >
                      {plan.ctaText} &rarr;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── FEATURE COMPARISON TABLE ── */}
        <div className="mt-20 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-heading text-2xl font-bold text-green-deep">
              Comprehensive Feature Comparison
            </h3>
            <p className="text-xs font-mono text-ink-muted">
              All statutory rules strictly enforced across every tier.
            </p>
          </div>

          <div className="rounded-sm border-2 border-border bg-paper shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-border bg-paper-dark">
                  <th scope="col" className="p-3.5 sm:p-4 font-mono font-bold text-ink uppercase tracking-wider sticky left-0 bg-paper-dark z-10 w-1/3">
                    Feature & Verification
                  </th>
                  <th scope="col" className="p-3.5 sm:p-4 font-mono font-bold text-ink text-center w-1/5">
                    Basic
                  </th>
                  <th scope="col" className="p-3.5 sm:p-4 font-mono font-bold text-green-deep text-center w-1/5 bg-green-deep/5">
                    Plus (Chambers)
                  </th>
                  <th scope="col" className="p-3.5 sm:p-4 font-mono font-bold text-ink text-center w-1/5">
                    Pro (Enterprise)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {COMPARISON_TABLE.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-paper-light transition-colors">
                    <td className="p-3.5 sm:p-4 font-sans font-medium text-ink sticky left-0 bg-paper z-10 border-r border-border/40">
                      <div className="font-semibold">{row.feature}</div>
                      <div className="text-[10px] font-mono text-ink-muted">{row.category}</div>
                    </td>

                    <td className="p-3.5 sm:p-4 text-center font-mono">
                      {typeof row.basic === 'boolean' ? (
                        row.basic ? <span className="text-green-deep font-bold text-sm">✓</span> : <span className="text-ink-muted/40">—</span>
                      ) : (
                        row.basic
                      )}
                    </td>

                    <td className="p-3.5 sm:p-4 text-center font-mono bg-green-deep/5 font-semibold text-green-deep">
                      {typeof row.plus === 'boolean' ? (
                        row.plus ? <span className="font-bold text-sm">✓</span> : <span className="text-ink-muted/40">—</span>
                      ) : (
                        row.plus
                      )}
                    </td>

                    <td className="p-3.5 sm:p-4 text-center font-mono">
                      {row.planned ? (
                        <span className="px-2 py-0.5 rounded-2xs bg-brass/20 text-brass font-bold text-[10px]">
                          Planned
                        </span>
                      ) : typeof row.pro === 'boolean' ? (
                        row.pro ? <span className="text-green-deep font-bold text-sm">✓</span> : <span className="text-ink-muted/40">—</span>
                      ) : (
                        row.pro
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── ACCESSIBLE FAQ ACCORDION ── */}
        {showFaq && (
          <div className="mt-24 max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-brass font-bold">
                Verification Details
              </span>
              <h3 className="font-heading text-2xl sm:text-3xl font-bold text-green-deep">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, fIdx) => {
                const isOpen = openFaqIndex === fIdx;

                return (
                  <div
                    key={fIdx}
                    className="rounded-sm border border-border bg-paper shadow-2xs overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                      aria-expanded={isOpen}
                      className="w-full p-4 sm:p-5 text-left font-heading text-base font-bold text-ink flex items-center justify-between gap-4 hover:bg-paper-light cursor-pointer focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden"
                    >
                      <span>{faq.q}</span>
                      <span className="font-mono text-base text-brass shrink-0">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-ink-muted font-sans leading-relaxed border-t border-border/60 pt-3 bg-paper-light/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Access Request / Sales Modal */}
      <ContactModal
        isOpen={modalState.isOpen}
        initialPlan={modalState.plan}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />
    </section>
  );
}
