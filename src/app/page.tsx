'use client';

import { Hero3DSection } from '@/components/landing/Hero3DSection';
import { AskNothiSection } from '@/components/chat/AskNothiSection';
import { FiveStagesFlow } from '@/components/landing/FiveStagesFlow';
import { AudienceSection } from '@/components/landing/AudienceSection';
import { CitationGateSection } from '@/components/landing/citation-gate/CitationGateSection';
import { PricingSection } from '@/components/pricing/PricingSection';
import { FinalCtaSection } from '@/components/landing/FinalCtaSection';

export default function HomePage() {
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

      {/* ── 2. ENTRY POINT B: ASK NOTHI AI DOORWAY SECTION ───────── */}
      <AskNothiSection />

      {/* ── 3. FIVE STAGES SERPENTINE ROADMAP ────────────────────── */}
      <section id="how-it-works" className="border-b border-border bg-paper scroll-mt-20">
        <FiveStagesFlow stages={pipelineStages} />
      </section>

      {/* ── 4. WHO IT'S FOR: 3 SRS AUDIENCES WITH EDITORIAL TYPOGRAPHY */}
      <AudienceSection />

      {/* ── 5. 3D CITATION GATE & ZERO-FABRICATION CHECKPOINT ─────── */}
      <CitationGateSection />

      {/* ── 6. THREE-TIER PRICING & FAQ SECTION ───────────────────── */}
      <PricingSection showFaq={true} />

      {/* ── 7. FINAL CALL TO ACTION ───────────────────────────────── */}
      <FinalCtaSection />
    </div>
  );
}
