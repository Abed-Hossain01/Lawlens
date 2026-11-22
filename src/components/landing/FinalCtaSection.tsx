'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { ContactModal } from '@/components/pricing/ContactModal';

export function FinalCtaSection() {
  const { lang } = useLang();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="py-20 sm:py-24 bg-paper-dark border-b border-border">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass/20 text-ink text-xs font-mono font-bold">
          <span>Phase 1 Production Ready</span>
        </div>

        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-green-deep tracking-tight max-w-3xl mx-auto">
          {lang === 'bn'
            ? 'আপনার চেম্বারের জন্য সংবিধিবদ্ধ দলিল যাচাই শুরু করুন'
            : 'Elevate statutory property vetting for your chamber'}
        </h2>

        <p className="font-sans text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
          {lang === 'bn'
            ? 'আইনি চেম্বার, আর্থিক প্রতিষ্ঠান ও ডেভেলপারদের সাথে যুক্ত হোন যারা কোনো বিভ্রমের ঝুঁকি ছাড়াই সংবিধিবদ্ধ সত্যের ভিত্তিতে দলিল নিরীক্ষা করছেন।'
            : 'Join legal advocates, commercial loan teams, and property examiners vetting deeds, Khatians, and NIDs with zero hallucination risk.'}
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-8 py-3.5 rounded-xs bg-green-deep hover:bg-green-mid text-paper font-sans text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Request a Demo &rarr;
          </button>

          <Link
            href="/audit"
            className="px-6 py-3.5 rounded-xs border-2 border-border bg-paper hover:bg-paper-light text-ink font-sans text-sm font-semibold transition-colors shadow-2xs"
          >
            Open Audit Workspace
          </Link>
        </div>
      </div>

      <ContactModal
        isOpen={modalOpen}
        initialPlan="demo"
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
