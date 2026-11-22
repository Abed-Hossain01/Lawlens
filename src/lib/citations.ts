import lawsCorpus from '@/data/laws_corpus.json';
import type { Citation, CorpusSection } from '@/types';

// Build a lookup set of valid corpus IDs at module load time
const corpusMap = new Map<string, CorpusSection>();
for (const entry of lawsCorpus as CorpusSection[]) {
  corpusMap.set(entry.id, entry);
}

/**
 * Returns the full corpus section for a given ID, or undefined if not found.
 */
export function getCorpusSectionById(id: string): CorpusSection | undefined {
  return corpusMap.get(id);
}

/**
 * Filters an array of citations, keeping only those whose IDs exist in laws_corpus.json.
 * Unknown IDs are silently stripped and logged to console.
 */
export function filterValidCitations(citations: Citation[]): Citation[] {
  return citations.filter((citation) => {
    const exists = corpusMap.has(citation.id);
    if (!exists) {
      console.warn(
        `[citation-filter] Unknown citation ID "${citation.id}" stripped. ` +
        `This ID does not exist in laws_corpus.json.`
      );
    }
    return exists;
  });
}

/**
 * Returns all entries in the corpus.
 */
export function getAllCorpusSections(): CorpusSection[] {
  return Array.from(corpusMap.values());
}

/**
 * Checks whether a given citation ID is valid (exists in the corpus).
 */
export function isValidCitationId(id: string): boolean {
  return corpusMap.has(id);
}
