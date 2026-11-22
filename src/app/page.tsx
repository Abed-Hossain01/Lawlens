'use client';

import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { Hero3DSection } from '@/components/landing/Hero3DSection';
import { FiveStagesFlow } from '@/components/landing/FiveStagesFlow';
import { CitationGateSection } from '@/components/landing/citation-gate/CitationGateSection';

export default function HomePage() {
  const { lang, t } = useLang();

  const pipelineStages = [
    {
      num: '01',
      titleEn: 'Ingestion & Normalization',
      titleBn: 'গ্রহণ ও স্বাভাবিককরণ',
      descEn:
        'PDF, JPG and PNG document bundles (up to 15 MB) are verified, OCR-preprocessed and normalized for mixed Bangla and English script parsing.',
      descBn:
        'দলিল প্যাকেটের ফাইল যাচাই, ওসিআর-প্রাকপ্রক্রিয়াকরণ এবং বাংলা ও ইংরেজি লিপির জন্য স্বাভাবিককরণ করা হয়।',
      srsRule: 'FR-1.1 & FR-1.2 Normalization',
    },
    {
      num: '02',
      titleEn: 'Multimodal Extraction',
      titleBn: 'বহুমাধ্যম নিষ্কাশন',
      descEn:
        'Key entities extracted from deed clauses, collectorate khatian ledgers, and NID smart cards: dag numbers, khatians, mouza, seller, buyer, father, and timestamps.',
      descBn:
        'দলিলের ধারা, কালেক্টরেট খতিয়ান ও জাতীয় পরিচয়পত্র থেকে সত্তা (দাগ, খতিয়ান, পক্ষ, তারিখ) নিষ্কাশন করা হয়।',
      srsRule: 'FR-2.1 Structured Extraction',
    },
    {
      num: '03',
      titleEn: 'Deterministic Cross-Audit',
      titleBn: 'নির্ণায়ক আন্তঃনথি পরীক্ষা',
      descEn:
        'Hard statutory rules enforce cross-document parity: Dag matching (FR-3.1), Sec. 23 4-month registration deadline (FR-3.2), and NID format length (FR-3.3).',
      descBn:
        'কোনো বিভ্রম নেই। কঠোর আইনি নিয়ম: দাগ মিল (FR-3.1), ধারা ২৩ এর ৪-মাসের নিবন্ধন সীমা (FR-3.2), এবং NID সংখ্যা দৈর্ঘ্য (FR-3.3)।',
      srsRule: 'FR-3.1, FR-3.2, FR-3.3 Hard Rules',
    },
    {
      num: '04',
      titleEn: 'Grounded Statutory Reasoning',
      titleBn: 'ভিত্তিক বিধিবদ্ধ যুক্তি',
      descEn:
        'Every risk flag maps strictly to verified statutory sections in laws_corpus.json. Any ungrounded or fabricated citation ID is stripped by strict deterministic filters.',
      descBn:
        'প্রতিটি ঝুঁকি পতাকা laws_corpus.json এর যাচাইকৃত ধারার সাথে আবদ্ধ। ভিত্তিহীন উদ্ধৃতি স্বয়ংক্রিয়ভাবে অপসারিত হয়।',
      srsRule: 'FR-4.1 Zero-Fabrication Filter',
    },
    {
      num: '05',
      titleEn: 'Split-Screen Audit UI',
      titleBn: 'বিভক্ত-পর্দা নিরীক্ষা ইউআই',
      descEn:
        'Dual-pane workspace with live synchronized document viewport, comparison matrix, citation inspector drawer, and printable vetting memorandum.',
      descBn:
        'দ্বৈত-পর্দা কার্যক্ষেত্র: সমন্বিত দলিল দর্শক, সত্তা তুলনা সারণী, ধারা পরিদর্শক এবং মুদ্রণযোগ্য আইনি স্মারক।',
      srsRule: 'FR-5.1 Interactive Memorandum',
    },
  ];

  return (
    <div className="flex flex-col bg-paper text-ink">
      {/* ── 1. HERO 3D SCENE: 400VH PINNED REGISTRY DESK ──────────── */}
      <Hero3DSection />

      {/* ── 2. SECTION 1: FIVE STAGES SERPENTINE ROADMAP ──────────── */}
      <section id="how-it-works" className="border-b border-border bg-paper scroll-mt-20">
        <FiveStagesFlow stages={pipelineStages} />
      </section>

      {/* ── 3. SECTION 2: 3D INTERACTIVE CITATION GATE CHECKPOINT ──── */}
      <CitationGateSection />

      {/* ── 4. SECTION 3: PHASE 1 REGISTRY INDEX WITH DOTTED LEADERS ─ */}
      <section id="phase-1-scope" className="py-24 border-b border-border bg-paper scroll-mt-24">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="border-b-2 border-green-deep pb-4 mb-12">
            <span className="text-xs font-mono uppercase tracking-widest text-ink-muted">
              Registry Gazette Scope • Phase 1
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-green-deep mt-1">
              {lang === 'bn' ? 'প্রথম পর্যায়ের সংবিধিবদ্ধ পরিধি' : 'Phase 1 Statutory Index'}
            </h2>
            <p className="text-sm text-ink-muted mt-1.5 max-w-2xl font-sans leading-relaxed">
              Three primary document types evaluated deterministically against four verified statutory corpora.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Column 1: Document Triad with Dotted Leaders */}
            <div className="border border-border rounded-xs bg-paper-light p-6 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-green-deep mb-6 pb-2 border-b border-border">
                1. Standard Document Triad
              </h3>

              <div className="space-y-5 font-sans text-sm">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">Saf Kabala Deed</span>
                    <span className="flex-1 border-b border-dotted border-border-light mx-2" />
                    <span className="font-mono text-xs text-green-deep font-bold">Property Deed</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 pl-4">
                    Sub-registry office deed vetting: seller, buyer, plot schedule, execution and registration timestamps.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">RS / BS Khatian</span>
                    <span className="flex-1 border-b border-dotted border-border-light mx-2" />
                    <span className="font-mono text-xs text-green-deep font-bold">Record of Rights</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 pl-4">
                    Collectorate Record of Rights: verifying ownership history, mouza boundaries, and Dag plot numbers.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">National ID Card</span>
                    <span className="flex-1 border-b border-dotted border-border-light mx-2" />
                    <span className="font-mono text-xs text-green-deep font-bold">Smart Card NID</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 pl-4">
                    Election Commission database parity: 10/13/17-digit format compliance, name matching, father name check.
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Statutory Acts with Dotted Leaders */}
            <div className="border border-border rounded-xs bg-paper-light p-6 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-green-deep mb-6 pb-2 border-b border-border">
                2. Statutory Corpus Verification
              </h3>

              <div className="space-y-5 font-sans text-sm">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">Registration Act, 1908</span>
                    <span className="flex-1 border-b border-dotted border-border-light mx-2" />
                    <span className="font-mono text-xs text-ink-muted">Sec. 17, 23, 24, 25, 28, 49</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 pl-4">
                    Compulsory registration requirements, 4-month presentation window, validity of transfers.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">Transfer of Property Act, 1882</span>
                    <span className="flex-1 border-b border-dotted border-border-light mx-2" />
                    <span className="font-mono text-xs text-ink-muted">Sec. 3, 6, 7, 10, 52, 54, 55</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 pl-4">
                    Valid execution of sale deeds, competency of transferor, notice, pending suits (Lis Pendens).
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">Land Crime Prevention & Remedy Act, 2023</span>
                    <span className="flex-1 border-b border-dotted border-border-light mx-2" />
                    <span className="font-mono text-xs text-ink-muted">Sec. 3, 4, 5, 6, 7, 8, 9</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 pl-4">
                    Criminal penalties for forged deeds, deceptive plot mutations, and fraudulent land transfers.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-ink">National Identity Registration Rules (NIDW)</span>
                    <span className="flex-1 border-b border-dotted border-border-light mx-2" />
                    <span className="font-mono text-xs text-ink-muted">Rule 3, 4, 5, 6</span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 pl-4">
                    Format validation for 10-digit smart cards, 13-digit legacy, and 17-digit national identity numbers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SECTION 4: FINAL CALL TO ACTION ─────────────────────── */}
      <section className="py-28 bg-paper-light">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="border-2 border-brass/60 p-8 sm:p-14 rounded-xs bg-paper shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            {/* Subtle double rule motif */}
            <div className="absolute top-2 left-2 right-2 bottom-2 border border-border-light pointer-events-none" />

            <div className="space-y-3 relative z-10 max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-widest text-green-mid font-bold">
                Team Boron • Pointfex Land Intelligence
              </div>
              <h3 className="font-heading text-3xl sm:text-4xl font-bold text-green-deep">
                {lang === 'bn'
                  ? 'দলিল পরীক্ষণ কার্যক্ষেত্রে প্রবেশ করুন'
                  : 'Launch the Audit Workspace'}
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed font-sans">
                {lang === 'bn'
                  ? 'সাফ কবলা, আরএস খতিয়ান ও এনআইডি আপলোড করুন অথবা বেঞ্চমার্ক প্যাকেট লোড করে তাৎক্ষণিক নির্ণায়ক আইনি নিরীক্ষা পরিচালনা করুন।'
                  : 'Upload Deed, Khatian and NID bundles or test against pre-loaded benchmark packets to inspect deterministic parity, live synchronized bounding boxes, and printable statutory memoranda.'}
              </p>
            </div>

            <div className="shrink-0 relative z-10">
              <Link
                href="/audit"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-xs bg-green-deep text-paper font-mono text-xs font-bold uppercase tracking-wider hover:bg-green-mid transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <span>{t('hero.cta')}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
