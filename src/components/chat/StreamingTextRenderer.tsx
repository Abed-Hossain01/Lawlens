'use client';

import React, { useMemo } from 'react';

interface StreamingTextRendererProps {
  text: string;
  isStreaming: boolean;
  reducedMotion?: boolean;
}

/**
 * Word-by-word streaming renderer with blur-to-sharp fade transition.
 * Appends words with stable index keys to prevent re-animating earlier words.
 */
export const StreamingTextRenderer = React.memo(function StreamingTextRenderer({
  text,
  isStreaming,
  reducedMotion = false,
}: StreamingTextRendererProps) {
  // Split paragraphs and words while keeping stable keys
  const renderedContent = useMemo(() => {
    if (!text) return null;

    const paragraphs = text.split('\n');

    return paragraphs.map((para, pIdx) => {
      if (!para.trim()) {
        return <div key={`p_${pIdx}`} className="h-3" />;
      }

      // Check if paragraph is a bullet item
      const isBullet = para.trim().startsWith('- ') || para.trim().startsWith('• ');
      const isNumbered = /^\d+\.\s/.test(para.trim());

      const content = isBullet
        ? para.trim().replace(/^[-•]\s*/, '')
        : isNumbered
        ? para.trim().replace(/^\d+\.\s*/, '')
        : para;

      const words = content.split(' ');

      return (
        <div
          key={`p_${pIdx}`}
          className={`leading-relaxed ${isBullet ? 'flex items-start gap-2 pl-4' : isNumbered ? 'flex items-start gap-2 pl-4' : 'mb-2.5'}`}
        >
          {isBullet && <span className="text-brass select-none shrink-0 mt-1 font-bold">•</span>}
          {isNumbered && <span className="font-mono text-xs text-brass select-none shrink-0 mt-0.5">{para.trim().match(/^\d+\./)?.[0]}</span>}

          <div className="flex-1">
            {words.map((word, wIdx) => {
              // Simple markdown bold detection **term**
              const isBold = word.startsWith('**') && word.endsWith('**') && word.length > 4;
              const cleanWord = isBold ? word.slice(2, -2) : word;

              return (
                <span
                  key={`w_${pIdx}_${wIdx}`}
                  className={`inline-block mr-1 transition-all ${
                    reducedMotion
                      ? 'animate-fade-in'
                      : isStreaming
                      ? 'animate-word-stream'
                      : ''
                  } ${isBold ? 'font-bold text-ink' : ''}`}
                >
                  {cleanWord}
                </span>
              );
            })}
          </div>
        </div>
      );
    });
  }, [text, isStreaming, reducedMotion]);

  return (
    <div className="text-base font-sans text-ink leading-relaxed select-text space-y-1.5">
      {renderedContent}

      {/* Blinking Brass Caret at end of streaming stream */}
      {isStreaming && (
        <span
          className="inline-block w-1.5 h-4 ml-1 bg-brass align-middle animate-pulse"
          aria-hidden="true"
        />
      )}

      <style jsx global>{`
        @keyframes wordStream {
          0% {
            opacity: 0;
            transform: translateY(2px);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .animate-word-stream {
          animation: wordStream 160ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 100ms ease-in forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
});
