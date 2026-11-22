# LawLens (ল-লেন্স) v1.0
### Legal Document Auditing System for Bangladesh Property Transfers
**By Team Boron at Pointfex**

LawLens is an automated legal vetting system for Bangladeshi property transactions. It enables Legal Vetting Officers to ingest a document triad (**Saf Kabala Property Deed**, **RS/BS Khatian**, **National ID Card**), performs multimodal entity extraction, executes deterministic statutory checks, maps findings to verified legal sections, and renders an official vetting memorandum.

---

## 1. Quick Start

### Prerequisites
- Node.js >= 22.12.0 (configured in `package.json` engines)
- npm 10+

### Installation & Verification
```bash
# Install dependencies
npm install

# Run linter
npm run lint

# TypeScript verification
npx tsc --noEmit

# Run unit tests (Vitest)
npm test

# Build for production (Next.js Turbopack)
npm run build

# Start production server
npm start
```
The application runs locally at `http://localhost:3000`.

---

## 2. Deploying to Vercel

LawLens is a **Next.js 16 (App Router) + React 19** application with strict TypeScript. To deploy to Vercel:

1. **Framework Preset**: Select **Next.js** (auto-detected).
2. **Node.js Version**: In Vercel Project Settings → General → Node.js Version, select **22.x** (compatible with `"engines": { "node": ">=22.12.0" }`).
3. **Build Command**: `npm run build` (or `next build`).
4. **Output Directory**: `.next` (Next.js default, do not override).
5. **Install Command**: `npm install` (standard strict peer dependency resolution).
6. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` (optional, defaults to mock API client if omitted). Refer to `.env.example`.

---

## 2. System Architecture & Pages

- **`/` (Landing Page)**: 
  - Registry-office desk 3D experience (built with Three.js / React Three Fiber / Drei).
  - 4-step scroll-driven simulation: Ingestion (fan out & lift) → Extraction (multimodal scanline) → Cross-document audit (field alignment & mismatch detection) → Statutory verdict (physical stamp press).
  - Automatic graceful degradation on mobile (<768px) and strict `prefers-reduced-motion` compliance via 2D diagnostic fallback.
  - Pipeline strip covering the 5 stages from the SRS.
  - Phase 1 statutory coverage specifications and CTA to the audit workspace.
- **`/audit` (Audit Workspace)**:
  - **Left Pane**: Multimodal document viewer with document switcher tabs (Deed, Khatian, NID), zoom/page controls, and live bounding-box highlighting synchronized with risk flags.
  - **Right Pane**:
    1. **Intake Section**: Drag-and-drop zone (PDF, JPG, PNG, max 15MB each, up to 3 files), plain-language validation alerts, manual document classifier, and one-click benchmark loaders for **Packet A (Compliant)** and **Packet B (3 Planted Defects)**.
    2. **Entity Comparison Matrix**: Cross-document entity comparison table with bilingual Bangla/English text and clear mismatch highlighting.
    3. **Risk Flags**: Red / Amber / Green statutory flags with shape badges (`▲ [CRITICAL DEFECT]`, `◆ [STATUTORY WARNING]`, `■ [STATUTORY COMPLIANCE]`) ensuring non-reliance on color alone.
    4. **Citation Inspector**: Drawer with verbatim statutory text from `laws_corpus.json` and supporting rule metadata.
    5. **Vetting Memorandum**: Official attestation document with inline statutory citation chips, verdict seal, and a `@media print` stylesheet.
    6. **Pipeline Progress State**: Calm inline progress sequence showing the 5 stages within the 18-second SLA (NFR-2).
- **Shared Shell**:
  - Header with navigation and live **EN / BN** bilingual toggle.
  - Footer with credit: `LawLens v1.0, Team Boron, Pointfex`.

---

## 3. How to Connect the FastAPI Backend

The frontend is built against an isolated API abstraction layer in `src/lib/api.ts`. Swapping from the mock layer to the live FastAPI backend is a **single-file change** in `src/lib/api.ts`.

### Steps:
1. Set your backend URL in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
2. In `src/lib/api.ts`, update `runAudit` to call the FastAPI endpoint:
   ```typescript
   export async function runAudit(
     bundle: AuditBundle,
     onProgress?: (progress: PipelineProgress) => void
   ): Promise<AuditResult> {
     const formData = new FormData();
     // Append uploaded files or packet benchmark flags
     bundle.files.forEach((file) => {
       // if file has File object: formData.append('files', file);
     });

     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit/run`, {
       method: 'POST',
       body: formData,
     });

     if (!response.ok) {
       throw new Error(`Audit failed with status ${response.status}`);
     }

     return await response.json();
   }
   ```
3. Update `uploadBundle` and `getCorpusSection` to point to `/audit/upload` and `/corpus/{id}` respectively.

---

## 4. File Manifest

```
LawLens/
├── src/
│   ├── app/
│   │   ├── audit/
│   │   │   └── page.tsx              # Audit workspace page (split screen)
│   │   ├── globals.css               # Design tokens, registry palette, print rules
│   │   ├── layout.tsx                # Root layout with fonts & LangProvider
│   │   └── page.tsx                  # Landing page (hero, pipeline, phase 1)
│   ├── components/
│   │   ├── Header.tsx                # Global navigation & EN/BN switcher
│   │   ├── Footer.tsx                # Official footer & credit
│   │   ├── audit/
│   │   │   ├── CitationChip.tsx      # Citation badge with integrity validation
│   │   │   ├── CitationDrawer.tsx    # Statutory section inspector side-drawer
│   │   │   ├── DocumentViewer.tsx    # Left-pane viewer with active bounding boxes
│   │   │   ├── EntityMatrix.tsx      # Cross-document comparison table
│   │   │   ├── IntakeSection.tsx     # File upload & benchmark packet loaders
│   │   │   ├── PipelineProgressTracker.tsx # 5-stage progress indicator (<18s)
│   │   │   ├── RiskFlags.tsx         # Red/Amber/Green flags with shapes & text
│   │   │   └── VettingMemo.tsx       # Printable official vetting memorandum
│   │   └── landing/
│   │       ├── DeskScene.tsx         # 3D Three.js registry desk scene
│   │       ├── Hero3DSection.tsx     # Scroll-driven hero container
│   │       ├── ReducedMotionFallback.tsx # 2D fallback for mobile & prefers-reduced-motion
│   │       └── RegistryDeskCanvas.tsx# React Three Fiber canvas wrapper
│   ├── data/
│   │   └── laws_corpus.json          # 28 statutory sections (verified Sec. 23 + placeholders)
│   ├── lib/
│   │   ├── __tests__/
│   │   │   └── citations.test.ts     # Vitest unit test for NFR-1 citation filter
│   │   ├── api.ts                    # Single API client interface
│   │   ├── citations.ts              # Citation verification & corpus lookups
│   │   └── lang.tsx                  # EN/BN bilingual context & dictionary
│   ├── mocks/
│   │   └── packets.ts                # Benchmark Packet A & Packet B data
│   └── types/
│       └── index.ts                  # TypeScript definitions (AuditResult, Flag, etc.)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 5. Placeholders to Replace with Real Data

When the FastAPI backend and final legal corpus are ready, update the following placeholders:

| Item | File Location | Description |
|---|---|---|
| **27 Statutory Sections** | `src/data/laws_corpus.json` | Section 23 of Registration Act 1908 is verified. The other 27 sections (Registration Act 17, 24, 25, 28, 32, 47, 49, 52; TPA 3, 6, 7, 10, 17, 52, 54, 55; LCPRA 3, 4, 5, 6, 7, 8, 9; NIDW Rules 3, 4, 5, 6) have clearly marked text: `PLACEHOLDER: replace with verified text from laws_corpus.json (28 sections)`. Replace with verified statutory text from the legal corpus. |
| **Document Bounding Boxes** | `src/types/index.ts` & `src/components/audit/DocumentViewer.tsx` | Currently uses representative bounding box coordinates for Deed, Khatian, and NID defect regions. Replace with normalized bounding boxes `[ymin, xmin, ymax, xmax]` provided by the backend's multimodal extraction service. |
| **API Endpoints** | `src/lib/api.ts` | Replace simulated delays and mock objects in `runAudit()`, `uploadBundle()`, and `getCorpusSection()` with live FastAPI fetch/Axios requests. |
| **Document Scan Assets** | `src/components/audit/DocumentViewer.tsx` | Replace mock vector-rendered SVG/HTML deed sheets with high-resolution scanned PDFs/TIFFs once ingested from the live file store (e.g. S3 / MinIO). |
