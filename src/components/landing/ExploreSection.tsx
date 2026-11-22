'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';

export function ExploreSection() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<'deed' | 'khatian' | 'nid'>('deed');

  const TRIAD_ITEMS = {
    deed: {
      titleEn: 'Saf Kabala Property Deed (সাফ কবলা)',
      badge: 'Primary Conveyance',
      act: 'Registration Act, 1908 (Sec. 17 & 23)',
      pointsEn: [
        'Automatic calculation of Section 23 4-month statutory execution-to-presentation window.',
        'Deterministic plot schedule parsing: Mouza, JL number, and Dag boundary allocations.',
        'Bilingual name matching between deed vendor, khatian owner, and NID smart card.',
      ],
      pointsBn: [
        'ধারা ২৩ অনুযায়ী দলিল সম্পাদন থেকে রেজিস্ট্রেশন উপস্থাপনের ৪ মাসের সংবিধিবদ্ধ সময়সীমা যাচাই।',
        'তফসিলের মৌজা, জেএল নম্বর এবং দাগের সীমানা সূক্ষ্মভাবে নিরূপণ।',
        'দলিলের বিক্রেতা, খতিয়ানের মালিক এবং এনআইডি স্মার্ট কার্ডের নামের দ্বৈত-ভাষিক সমন্বয়।',
      ],
      previewTextEn: 'Deed No. 4812/2023 • Sub-Registry Office Sadar • Execution: 12-Oct-2023',
    },
    khatian: {
      titleEn: 'Collectorate RS / BS Khatian (খতিয়ান)',
      badge: 'Record of Rights',
      act: 'Transfer of Property Act, 1882 (Sec. 54)',
      pointsEn: [
        'Cross-checks deed schedule Dag plot numbers against collectorate Record of Rights ledgers.',
        'Identifies Dag mismatch discrepancies before conveyance registration to prevent title defect.',
        'Verifies possession history and mutation status under Land Crime Prevention Act Section 4.',
      ],
      pointsBn: [
        'কালেক্টরেট রেকর্ড অব রাইটস খতিয়ানের সাথে দলিলের তফসিলের দাগ নম্বরের মিল নিশ্চিতকরণ।',
        'স্বত্ব জটিলতা এড়াতে দলিল নিবন্ধনের পূর্বেই দাগের গরমিল তাৎক্ষণিক শনাক্তকরণ।',
        'ভূমি অপরাধ প্রতিরোধ আইনের ধারা ৪ এর অধীনে দখল ও নামজারির আইনি ধারাবাহিকতা যাচাই।',
      ],
      previewTextEn: 'Khatian No. 104 • Mouza: Tejgaon • RS Dag No. 892 • Share: 0.1650 Acre',
    },
    nid: {
      titleEn: 'National Identity Smart Card (জাতীয় পরিচয়পত্র)',
      badge: 'Identity Parity',
      act: 'NIDW Rules, 2010 (Rule 3)',
      pointsEn: [
        'Strict structural format validation for 10-digit smart cards, 13-digit, and 17-digit national IDs.',
        'Identifies truncated or invalid identity numbers (e.g. 9-digit defects) instantly.',
        'Cross-references party details against deed recitals and khatian holder lines.',
      ],
      pointsBn: [
        '১০-ডিজিটের স্মার্ট কার্ড, ১৩-ডিজিট ও ১৭-ডিজিটের জাতীয় পরিচয়পত্রের কাঠামোগত নির্ভুলতা যাচাই।',
        'অপূর্ণাঙ্গ বা ত্রুটিপূর্ণ পরিচয় নম্বর (যেমন ৯-ডিজিট ত্রুটি) স্বয়ংক্রিয়ভাবে প্রতিরোধ।',
        'দলিলের পক্ষগণের তথ্যের সাথে জাতীয় পরিচয়পত্রের তথ্যের সম্পূর্ণ মিল যাচাই।',
      ],
      previewTextEn: 'NID: 19882692015000142 • Format: 17-Digit Standard • Status: Verified',
    },
  };

  const current = TRIAD_ITEMS[activeTab];

  return (
    <section
      id="explore"
      className="py-24 border-b border-border bg-paper scroll-mt-24"
      aria-labelledby="explore-heading"
    >
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass/15 border border-brass/30 text-xs font-mono font-bold text-ink">
            <span className="w-2 h-2 rounded-full bg-green-deep animate-pulse" />
            <span>Autonomous Registry Intelligence</span>
          </div>

          <h2
            id="explore-heading"
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-green-deep tracking-tight"
          >
            {lang === 'bn'
              ? 'বাংলাদেশের সম্পত্তি দলিলের বুদ্ধিমত্তা অন্বেষণ করুন'
              : 'Explore Bangladesh Property Intelligence'}
          </h2>

          <p className="font-sans text-base sm:text-lg text-ink-muted leading-relaxed">
            {lang === 'bn'
              ? 'সাফ কবলা দলিল, কালেক্টরেট খতিয়ান ও এনআইডির নির্ণায়ক সমন্বয়। কোনো বিভ্রম নেই—প্রতিটি তথ্য ২৮টি সংবিধিবদ্ধ আইনি ধারার ভিত্তিতে যাচাইকৃত।'
              : 'Deterministic cross-parity examination for property deeds, collectorate khatians, and identity records. Zero hallucination—every single finding maps strictly to 28 verified statutory sections.'}
          </p>
        </div>

        {/* ── 3-CARD EXPLORATION MATRIX ── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Triad Explorer (7 Cols) */}
          <div className="lg:col-span-7 border-2 border-border rounded-xs bg-paper-light p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-green-deep">
                Document Triad Inspector
              </span>
              <span className="text-xs font-mono text-ink-muted">
                3 Standard Registry Records
              </span>
            </div>

            {/* Triad Tab Buttons */}
            <div className="mt-6 flex flex-wrap gap-2">
              {(['deed', 'khatian', 'nid'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xs font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-green-deep text-paper shadow-xs'
                      : 'bg-paper text-ink border border-border hover:bg-paper-dark'
                  }`}
                >
                  {tab === 'deed' ? 'Saf Kabala Deed' : tab === 'khatian' ? 'RS/BS Khatian' : 'National ID'}
                </button>
              ))}
            </div>

            {/* Active Record Detail */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-heading text-xl font-bold text-green-deep">
                  {current.titleEn}
                </h3>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-brass/20 text-ink font-semibold">
                  {current.badge}
                </span>
              </div>

              <div className="p-3 rounded-xs bg-paper border border-border/80 font-mono text-xs text-ink-muted">
                Statutory Authority: <span className="text-green-deep font-semibold">{current.act}</span>
              </div>

              <ul className="space-y-3 font-sans text-sm text-ink pt-2">
                {(lang === 'bn' ? current.pointsBn : current.pointsEn).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-green-deep font-bold mt-0.5">✓</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-ink-muted">
                <span>Sample Normalized Metadata:</span>
                <span className="text-ink font-medium">{current.previewTextEn}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Creative Quick Explorer Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Statutory Lock */}
            <div className="border border-border rounded-xs bg-paper p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brass/10 rounded-bl-full pointer-events-none" />
              <div className="text-xs font-mono font-bold text-brass uppercase tracking-wider">
                Integrity Guarantee
              </div>
              <h3 className="font-heading text-lg font-bold text-green-deep mt-1">
                Zero-Fabrication Citation Gate
              </h3>
              <p className="text-xs text-ink-muted mt-2 font-sans leading-relaxed">
                Fabricated case citations or hallucinated legal sections create lethal title defects. Nothi AI deterministically validates every citation against our verified 28-section statutory corpus.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-xs bg-green-deep/10 text-green-deep border border-green-deep/20">
                  28 Sections
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-xs bg-brass/15 text-ink border border-brass/30">
                  4 Acts
                </span>
                <Link
                  href="#citations"
                  className="text-xs font-sans text-green-deep hover:underline ml-auto font-medium"
                >
                  Test checkpoint &darr;
                </Link>
              </div>
            </div>

            {/* Card 2: Interactive AI Assistant Card */}
            <div className="border-2 border-green-deep/40 rounded-xs bg-gradient-to-br from-paper-light via-paper to-brass/10 p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brass animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-green-deep">
                  Dedicated AI Legal Assistant
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-green-deep">
                {lang === 'bn' ? 'নথি এআই চ্যাট সহকারীর সাথে কথা বলুন' : 'Interactive Statutory Chat Workspace'}
              </h3>
              <p className="text-xs text-ink-muted font-sans leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার দলিলের ছবি বা পিডিএফ আপলোড করুন, ধারা ২৩ এর সময়সীমা এবং খতিয়ান সংক্রান্ত প্রশ্ন করুন।'
                  : 'Drop deed photos or PDFs, examine 4-month presentation windows, verify NID formats, and save multiple chat sessions.'}
              </p>
              <div className="pt-2">
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xs bg-green-deep hover:bg-green-mid text-paper font-sans text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>{lang === 'bn' ? 'এআই সহকারীর সাথে চ্যাট করুন →' : 'Launch Nothi AI Assistant →'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
