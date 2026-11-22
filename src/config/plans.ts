/**
 * Nothi AI Subscription & Pricing Configuration
 *
 * Edit plan prices, allowances, and feature inclusions here.
 * NOTE: All prices marked with TODO: set real price before production launch.
 */

export interface PlanFeature {
  text: string;
  included: boolean;
  planned?: boolean;
}

export interface PlanConfig {
  id: 'basic' | 'plus' | 'pro';
  name: string;
  tagline: string;
  recommended?: boolean;
  badge?: string;
  // TODO: set real price
  priceMonthlyBdt: number | null; // null for custom/contact
  // TODO: set real price
  priceYearlyBdt: number | null;
  ctaText: string;
  ctaType: 'audit' | 'request-access' | 'talk-to-us';
  features: PlanFeature[];
}

export interface FeatureComparisonRow {
  category: string;
  feature: string;
  basic: string | boolean;
  plus: string | boolean;
  pro: string | boolean;
  planned?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For solo advocates and independent legal chambers',
    recommended: false,
    // TODO: set real price
    priceMonthlyBdt: 2500,
    // TODO: set real price
    priceYearlyBdt: 24000,
    ctaText: 'Start with Basic',
    ctaType: 'audit',
    features: [
      { text: 'Up to 25 document audits per month', included: true },
      { text: 'Triad bundle intake: Saf Kabala, RS/BS Khatian, NID', included: true },
      { text: 'Deterministic Red / Amber / Green statutory risk flags', included: true },
      { text: 'Cross-document entity comparison matrix', included: true },
      { text: 'Citation inspector with laws_corpus.json verification', included: true },
      { text: 'Pre-loaded benchmark packets (Packet A & Packet B)', included: true },
      { text: 'Bilingual English & Bangla interface', included: true },
      { text: 'Standard community support', included: true },
      { text: 'Downloadable vetting memorandum (print / PDF)', included: false },
      { text: 'Saved multi-case audit history', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'For active law chambers and real-estate developers',
    recommended: true,
    badge: 'Most chosen',
    // TODO: set real price
    priceMonthlyBdt: 7500,
    // TODO: set real price
    priceYearlyBdt: 72000,
    ctaText: 'Request access',
    ctaType: 'request-access',
    features: [
      { text: 'Up to 150 document audits per month', included: true },
      { text: 'Everything included in Basic', included: true },
      { text: 'Official downloadable vetting memorandum (PDF/Print ready)', included: true },
      { text: 'Persistent audit archive & case history', included: true },
      { text: 'Nothi AI statutory chat with higher daily allowance', included: true },
      { text: 'Citation inspector deep drawer links', included: true },
      { text: 'Priority email & chat support within 4 hours', included: true },
      { text: 'Custom audit volume & team seat provisioning', included: false },
      { text: 'Enterprise compliance audit log export', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For commercial banks, financial institutions and large teams',
    recommended: false,
    // TODO: set real price
    priceMonthlyBdt: null, // Custom enterprise pricing
    // TODO: set real price
    priceYearlyBdt: null,
    ctaText: 'Talk to us',
    ctaType: 'talk-to-us',
    features: [
      { text: 'Unlimited or tailored monthly audit volume', included: true },
      { text: 'Everything included in Plus', included: true },
      { text: 'Multi-seat team licenses with role-based access', included: true },
      { text: 'Full compliance audit trail & CSV/JSON export', included: true },
      { text: 'Nothi AI chat with highest message throughput', included: true },
      { text: 'Dedicated legal onboarding & workflow integration session', included: true },
      { text: 'Custom SLA & 24/7 dedicated support representative', included: true },
      { text: 'RJSC Company registry mortgage charge pack', included: false, planned: true },
      { text: 'NBR Tax clearance & revenue verification module', included: false, planned: true },
      { text: 'Secure API Webhooks & Core Banking integration', included: false, planned: true },
    ],
  },
];

export const COMPARISON_TABLE: FeatureComparisonRow[] = [
  // Intake & Scope
  {
    category: 'Document Vetting Scope',
    feature: 'Monthly Audit Allowance',
    basic: '25 audits / mo',
    plus: '150 audits / mo',
    pro: 'Custom / Unlimited',
  },
  {
    category: 'Document Vetting Scope',
    feature: 'Standard Document Triad (Deed, Khatian, NID)',
    basic: true,
    plus: true,
    pro: true,
  },
  {
    category: 'Document Vetting Scope',
    feature: 'File Size Limit per Document',
    basic: '15 MB',
    plus: '15 MB',
    pro: '25 MB',
  },

  // Audit Capabilities
  {
    category: 'Statutory Engine',
    feature: 'Deterministic Red/Amber/Green Risk Flags',
    basic: true,
    plus: true,
    pro: true,
  },
  {
    category: 'Statutory Engine',
    feature: 'Cross-Document Entity Comparison Matrix',
    basic: true,
    plus: true,
    pro: true,
  },
  {
    category: 'Statutory Engine',
    feature: 'Citation Lock (Zero-Fabrication Guarantee)',
    basic: true,
    plus: true,
    pro: true,
  },
  {
    category: 'Statutory Engine',
    feature: 'Official Vetting Memorandum Export',
    basic: false,
    plus: 'PDF & Print',
    pro: 'PDF, Print & Custom Header',
  },
  {
    category: 'Statutory Engine',
    feature: 'Saved Audit Case History',
    basic: false,
    plus: true,
    pro: true,
  },

  // AI Assistant
  {
    category: 'Nothi AI Statutory Chat',
    feature: 'Citation-Locked Legal Assistant',
    basic: 'Community preview',
    plus: 'Standard daily limit',
    pro: 'Highest priority limit',
  },

  // Enterprise & Future Scope
  {
    category: 'Team & Governance',
    feature: 'Team Member Seats',
    basic: '1 seat',
    plus: '3 seats',
    pro: 'Custom multi-seat',
  },
  {
    category: 'Team & Governance',
    feature: 'Audit Trail & Compliance Log Export',
    basic: false,
    plus: false,
    pro: true,
  },
  {
    category: 'Future Scope (Phase 2)',
    feature: 'RJSC Registry Mortgage Charges',
    basic: false,
    plus: false,
    pro: 'Planned',
    planned: true,
  },
  {
    category: 'Future Scope (Phase 2)',
    feature: 'NBR Income Tax Verification',
    basic: false,
    plus: false,
    pro: 'Planned',
    planned: true,
  },
  {
    category: 'Future Scope (Phase 2)',
    feature: 'API Webhooks for Core Systems',
    basic: false,
    plus: false,
    pro: 'Planned',
    planned: true,
  },
];
