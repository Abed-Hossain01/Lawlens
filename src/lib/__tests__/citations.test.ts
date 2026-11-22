import { describe, it, expect, vi } from 'vitest';
import { filterValidCitations, isValidCitationId, getCorpusSectionById } from '@/lib/citations';
import type { Citation } from '@/types';

describe('Citation Filter', () => {
  it('keeps citations whose IDs exist in laws_corpus.json', () => {
    const citations: Citation[] = [
      {
        id: 'reg_act_1908_s23',
        act: 'Registration Act, 1908',
        section: 'Section 23',
        title: 'Time for presenting documents',
      },
    ];

    const result = filterValidCitations(citations);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('reg_act_1908_s23');
  });

  it('strips citations whose IDs do not exist in laws_corpus.json', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const citations: Citation[] = [
      {
        id: 'reg_act_1908_s23',
        act: 'Registration Act, 1908',
        section: 'Section 23',
        title: 'Time for presenting documents',
      },
      {
        id: 'fake_law_s999',
        act: 'Nonexistent Act',
        section: 'Section 999',
        title: 'Does not exist',
      },
    ];

    const result = filterValidCitations(citations);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('reg_act_1908_s23');

    // Verify the unknown ID was logged
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('fake_law_s999')
    );

    warnSpy.mockRestore();
  });

  it('returns empty array when all citations are unknown', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const citations: Citation[] = [
      {
        id: 'totally_made_up',
        act: 'Made Up Act',
        section: 'Section 0',
        title: 'Nothing',
      },
    ];

    const result = filterValidCitations(citations);
    expect(result).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('returns empty array for empty input', () => {
    const result = filterValidCitations([]);
    expect(result).toHaveLength(0);
  });

  it('isValidCitationId returns true for known IDs', () => {
    expect(isValidCitationId('reg_act_1908_s23')).toBe(true);
    expect(isValidCitationId('nidw_rules_r3')).toBe(true);
    expect(isValidCitationId('tpa_1882_s54')).toBe(true);
  });

  it('isValidCitationId returns false for unknown IDs', () => {
    expect(isValidCitationId('nonexistent_id')).toBe(false);
    expect(isValidCitationId('')).toBe(false);
  });

  it('getCorpusSectionById returns the full corpus entry', () => {
    const section = getCorpusSectionById('reg_act_1908_s23');
    expect(section).toBeDefined();
    expect(section!.act).toBe('Registration Act, 1908');
    expect(section!.section).toBe('Section 23');
    expect(section!.text).toContain('four months');
    expect(section!.version).toBe('verified-v1');
  });

  it('getCorpusSectionById returns undefined for unknown IDs', () => {
    const section = getCorpusSectionById('does_not_exist');
    expect(section).toBeUndefined();
  });
});
