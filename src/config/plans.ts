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
  id: 'free' | 'basic' | 'pro';
  name: string;
  tagline: string;
  recommended?: boolean;
  badge?: string;
  // TODO: set real price
  priceMonthlyBdt: number | null; // null for custom/contact
  // TODO: set real price
  priceYearlyBdt: number | null;
  ctaText: string;
  ctaType: 'free' | 'request-access' | 'talk-to-us';
  features: PlanFeature[];
}

export interface FeatureComparisonRow {
  category: string;
  feature: string;
  free: string | boolean;
  basic: string | boolean;
  pro: string | boolean;
  planned?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'For independent advocates exploring statutory vetting',
    recommended: false,
    badge: 'Starter',
    priceMonthlyBdt: 0,
    priceYearlyBdt: 0,
    ctaText: 'Start Free',
    ctaType: 'free',
    features: [
      { text: 'Up to 5 document bundle audits per month', included: true },
      { text: 'Saf Kabala deed, RS/BS Khatian & NID verification', included: true },
      { text: 'Deterministic Red / Amber / Green statutory risk flags', included: true },
      { text: 'Grounded Nothi AI chat (28 verified statutory sections)', included: true },
      { text: 'Section 23 4-month presentation window calculation', included: true },
      { text: 'Bilingual English & Bangla interface', included: true },
      { text: 'Downloadable vetting memorandum (PDF/Print ready)', included: false },
      { text: 'Persistent audit archive & case history', included: false },
      { text: 'Multi-user advocate team seats & role provisioning', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For solo advocates and growing legal chambers',
    recommended: true,
    badge: 'Most popular',
    // TODO: set real price
    priceMonthlyBdt: 2500,
    // TODO: set real price
    priceYearlyBdt: 24000,
    ctaText: 'Get Basic',
    ctaType: 'request-access',
    features: [
      { text: 'Up to 60 document bundle audits per month', included: true },
      { text: 'Everything included in Free', included: true },
      { text: 'Official downloadable vetting memorandum (PDF/Print ready)', included: true },
      { text: 'Lis Pendens litigation screening (TPA 1882 Sec. 52)', included: true },
      { text: 'Land crime penal liability screening (LCPRA 2023 Sec. 4)', included: true },
      { text: 'Persistent audit archive & case history', included: true },
      { text: 'Priority email & chat support within 4 hours', included: true },
      { text: 'Multi-user advocate team seats & role provisioning', included: false },
      { text: 'Bank VAT/AIT invoices & institutional purchase orders', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For commercial banks, financial institutions & syndicates',
    recommended: false,
    badge: 'Enterprise',
    // TODO: set real price
    priceMonthlyBdt: 7500,
    // TODO: set real price
    priceYearlyBdt: 72000,
    ctaText: 'Upgrade to Pro',
    ctaType: 'talk-to-us',
    features: [
      { text: 'Unlimited monthly document audit volume', included: true },
      { text: 'Everything included in Basic', included: true },
      { text: 'Priority multimodal OCR extraction queue', included: true },
      { text: 'Multi-user advocate team seats & role provisioning', included: true },
      { text: 'Formal bank VAT/AIT invoices & institutional purchase orders', included: true },
      { text: 'Dedicated compliance account manager & SLA guarantee', included: true },
      { text: 'REST API webhooks for core banking systems (Planned)', included: true, planned: true },
      { text: 'Custom RJSC & NBR verification modules (Planned)', included: true, planned: true },
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
