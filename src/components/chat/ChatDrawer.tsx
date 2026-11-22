'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChat } from '@/context/ChatContext';
import { useLang } from '@/lib/lang';
import { Logo } from '@/components/Logo';
import { DrawerDetailModal } from '@/components/landing/citation-gate/DrawerDetailModal';

const SUGGESTED_QUESTIONS = [
  'How long can pass between signing and registering a deed?',
  'What makes an NID number valid?',
  'What does a Dag number mismatch mean?',
  'What is a Khatian used for?',
];

export function ChatDrawer() {
  const {
    isOpen,
    setIsOpen,
    messages,
    isStreaming,
    sendMessage,
    newChat,
    regenerateLast,
    stopStreaming,
    activeCitationSection,
    inspectCitation,
    closeCitationInspector,
  } = useChat();

  const { lang, setLang } = useLang();
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus management and escape key listener
  useEffect(() => {
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      textareaRef.current?.focus();

      const handleKeyDown = (e: globalThis.KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus();
      }
    }
  }, [isOpen, setIsOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBottom]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 80;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    sendMessage(inputText);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── BACKDROP (DIMMED BUT NON-BLOCKING FOR PAGE SCROLL) ── */}
      <div
        className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px] transition-opacity duration-200"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── CHAT DRAWER PANEL (440PX DESKTOP / FULL-SCREEN MOBILE) ── */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Nothi AI Statutory Legal Assistant"
        className="fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-paper text-ink shadow-2xl flex flex-col border-l border-border transition-transform duration-250 ease-out"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-border bg-paper-light flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Logo />
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="px-2 py-1 rounded-xs border border-border text-[11px] font-mono hover:bg-paper-dark transition-colors cursor-pointer"
              title="Toggle reply language"
            >
              {lang === 'en' ? 'বাংলা' : 'EN'}
            </button>

            {/* New Chat Button */}
            <button
              type="button"
              onClick={newChat}
              className="px-2.5 py-1 rounded-xs border border-border bg-paper text-xs font-mono hover:bg-paper-dark transition-colors cursor-pointer"
              title="Start a new conversation"
            >
              New chat
            </button>

            {/* Close Drawer Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat drawer"
              className="p-1.5 rounded-xs text-ink-muted hover:text-ink hover:bg-paper-dark transition-colors focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-hidden cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.length === 0 ? (
            /* ── EMPTY STATE ── */
            <div className="h-full flex flex-col justify-center space-y-6 text-center px-2 py-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-deep/10 border border-green-deep/30 flex items-center justify-center text-green-deep">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-green-deep">
                  {lang === 'bn' ? 'নথি এআই সংবিধিবদ্ধ সহকারী' : 'Ask Nothi AI'}
                </h3>
                <p className="text-xs text-ink-muted font-sans leading-relaxed">
                  {lang === 'bn'
                    ? 'বাংলাদেশের স্থাবর সম্পত্তি হস্তান্তরের সংবিধিবদ্ধ আইন (রেজিস্ট্রেশন আইন, সম্পত্তি হস্তান্তর আইন ও এনআইডি) সম্পর্কিত প্রশ্ন করুন।'
                    : 'Ask about Bangladeshi statutory property law, deed registration windows, NID validation formats, or Khatian records.'}
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                  Suggested Questions:
                </span>
                <div className="space-y-1.5">
                  {SUGGESTED_QUESTIONS.map((question, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => sendMessage(question)}
                      className="w-full text-left p-2.5 rounded-sm border border-border bg-paper-light hover:bg-paper-dark/60 text-xs font-sans text-ink transition-colors cursor-pointer flex items-center justify-between group"
                    >
                      <span>{question}</span>
                      <span className="text-brass opacity-0 group-hover:opacity-100 transition-opacity">
                        &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── MESSAGE THREAD ── */
            <>
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLastAssistant =
                  !isUser && index === messages.map((m) => m.role).lastIndexOf('assistant');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                  >
                    {/* Timestamp tooltip on hover */}
                    <span className="text-[10px] font-mono text-ink-muted/60 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* Bubble */}
                    <div
                      className={`relative text-sm font-sans leading-relaxed ${
                        isUser
                          ? 'bg-paper-dark text-ink rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[85%]'
                          : 'bg-surface border border-border/80 text-ink rounded-2xl rounded-tl-xs p-4 max-w-[94%] shadow-xs'
                      }`}
                    >
                      {msg.content ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        /* Typing indicator while streaming starts */
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="w-2 h-2 rounded-full bg-brass animate-pulse" />
                          <span className="w-2 h-2 rounded-full bg-brass animate-pulse delay-100" />
                          <span className="w-2 h-2 rounded-full bg-brass animate-pulse delay-200" />
                        </div>
                      )}

                      {/* Citation Chips */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-border/70 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-green-deep font-bold block">
                            Verified Statutory Citations:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((cite) => (
                              <button
                                key={cite.id}
                                type="button"
                                onClick={() => inspectCitation(cite.id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-green-deep/10 text-green-deep border border-green-deep/30 font-mono text-[11px] font-semibold hover:bg-green-deep/20 transition-colors cursor-pointer"
                                title={`Inspect Section: ${cite.act}`}
                              >
                                <span>📜</span>
                                <span>
                                  {cite.section ? `${cite.section} • ` : ''}
                                  {cite.act}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assistant Actions Bar */}
                      {!isUser && msg.content && (
                        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono text-ink-muted">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="hover:text-ink cursor-pointer flex items-center gap-1"
                          >
                            <span>{copiedId === msg.id ? '✓ Copied' : 'Copy'}</span>
                          </button>

                          {isLastAssistant && !isStreaming && (
                            <button
                              type="button"
                              onClick={regenerateLast}
                              className="hover:text-ink cursor-pointer flex items-center gap-1"
                            >
                              <span>↺ Regenerate</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Jump to Latest Floating Pill */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-ink text-paper text-xs font-mono shadow-md border border-border flex items-center gap-1 cursor-pointer animate-in fade-in"
          >
            <span>↓ Jump to latest</span>
          </button>
        )}

        {/* Input Form Bar */}
        <div className="p-3.5 border-t border-border bg-paper-light space-y-2 shrink-0">
          <div className="relative flex items-end rounded-sm border border-border bg-paper shadow-inner focus-within:ring-2 focus-within:ring-brass focus-within:border-brass">
            <textarea
              ref={textareaRef}
              rows={1}
              maxLength={1000}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                lang === 'bn'
                  ? 'দলিল দাখিলের সময়সীমা বা ধারা সম্পর্কে প্রশ্ন লিখুন...'
                  : 'Ask about deed timelines, NID formats, or Khatians...'
              }
              className="flex-1 p-2.5 text-xs font-sans text-ink placeholder:text-ink-muted/50 bg-transparent resize-none max-h-32 focus:outline-hidden"
            />

            <div className="p-2 flex items-center gap-1.5">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="px-2.5 py-1.5 rounded-xs bg-vermillion text-paper font-mono text-xs font-bold hover:bg-vermillion/90 transition-colors cursor-pointer"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!inputText.trim()}
                  onClick={handleSend}
                  className="p-1.5 rounded-xs bg-green-deep text-paper hover:bg-green-mid disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Character counter & statutory disclaimer note */}
          <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted">
            <span className="leading-tight">
              Nothi AI explains verified statutory sections. It does not replace a licensed advocate.
            </span>
            <span className="shrink-0 ml-2">{inputText.length}/1000</span>
          </div>
        </div>
      </div>

      {/* Citation Inspector Modal (Triggered by clicking chips) */}
      <DrawerDetailModal
        section={activeCitationSection}
        citationId={activeCitationSection?.id || null}
        onClose={closeCitationInspector}
      />
    </>
  );
}
