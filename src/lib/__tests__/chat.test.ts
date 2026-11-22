import { describe, it, expect, vi } from 'vitest';
import { sendChatMessage } from '@/lib/chat';
import * as mockLayer from '@/mocks/chat';

describe('Nothi AI Chat Client & Citation Integrity', () => {
  it('returns citation-locked answers for in-corpus statutory queries', async () => {
    const response = await sendChatMessage(
      [
        {
          id: 'msg-1',
          role: 'user',
          content: 'How long can pass between signing and registering a deed?',
          timestamp: Date.now(),
        },
      ],
      'en'
    );

    expect(response.content).toContain('Section 23');
    expect(response.content).toContain('four months');
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.citations[0].id).toBe('reg_act_1908_s23');
  });

  it('handles out-of-corpus questions by refusing to fabricate and returning 0 citations', async () => {
    const response = await sendChatMessage(
      [
        {
          id: 'msg-2',
          role: 'user',
          content: 'What is the corporate income tax rate on dividends in Bangladesh?',
          timestamp: Date.now(),
        },
      ],
      'en'
    );

    expect(response.content).toContain('cannot find this topic in our verified statutory corpus');
    expect(response.citations).toHaveLength(0);
  });

  it('strictly strips any unknown or fabricated citation IDs before rendering', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Spy on generateMockChatResponse to inject a fabricated citation ID alongside a valid one
    vi.spyOn(mockLayer, 'generateMockChatResponse').mockResolvedValueOnce({
      content: 'Simulated answer with a real citation and a fabricated hallucination.',
      citations: [
        {
          id: 'reg_act_1908_s23',
          act: 'Registration Act, 1908',
          section: 'Section 23',
        },
        {
          id: 'reg_act_9999_completely_fake_section',
          act: 'Fake Act, 2099',
          section: 'Section 9999',
        },
      ],
    });

    const response = await sendChatMessage(
      [
        {
          id: 'msg-3',
          role: 'user',
          content: 'Test query for fabricated citation stripping',
          timestamp: Date.now(),
        },
      ],
      'en'
    );

    // Only the valid citation should remain
    expect(response.citations).toHaveLength(1);
    expect(response.citations[0].id).toBe('reg_act_1908_s23');

    // Console warning should have been logged for the unknown ID
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('reg_act_9999_completely_fake_section')
    );

    warnSpy.mockRestore();
    vi.restoreAllMocks();
  });
});
