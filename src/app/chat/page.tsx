'use client';

import { useState, useRef, useEffect, useCallback, useMemo, KeyboardEvent, DragEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { Logo } from '@/components/Logo';
import { DrawerDetailModal } from '@/components/landing/citation-gate/DrawerDetailModal';
import { sendChatMessage, ChatMessage, ChatAttachment } from '@/lib/chat';
import { getCorpusSectionById, resolveCanonicalId } from '@/lib/citations';
import type { CorpusSection } from '@/types';

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function nowTimestamp(): number {
  return Date.now();
}

const STORAGE_SESSIONS_KEY = 'nothi_ai_sessions_v2';
const ACTIVE_SESSION_ID_KEY = 'nothi_ai_active_session_id';

const SUGGESTED_CARDS = [
  {
    icon: '📑',
    titleEn: 'Saf Kabala Deed Presentation Window',
    titleBn: 'সাফ কবলা দলিলের রেজিস্ট্রেশন সময়সীমা',
    promptEn: 'How long can pass between signing and registering a Saf Kabala deed under Section 23?',
    promptBn: 'রেজিস্ট্রেশন আইন ১৯০৮ এর ধারা ২৩ অনুযায়ী সাফ কবলা দলিল সম্পাদনের পর কতদিনের মধ্যে তা রেজিস্ট্রি করতে হবে?',
    rule: 'Registration Act 1908 (Sec. 23)',
  },
  {
    icon: '🪪',
    titleEn: 'National ID Format Parity',
    titleBn: 'জাতীয় পরিচয়পত্রের ফরম্যাট বৈধতা',
    promptEn: 'What makes an NID number structurally valid under Rule 3 of the NIDW Rules?',
    promptBn: 'এনআইডি বিধিমালা ২০১০ এর বিধি ৩ অনুসারে জাতীয় পরিচয়পত্রের কোন ফরম্যাটগুলো সংবিধিবদ্ধভাবে বৈধ?',
    rule: 'NIDW Rules 2010 (Rule 3)',
  },
  {
    icon: '⚖️',
    titleEn: 'Lis Pendens Litigation Risk',
    titleBn: 'বিচারাধীন মামলার ঝুঁকি (Lis Pendens)',
    promptEn: 'What are the legal consequences of transferring land during a pending court suit under Section 52?',
    promptBn: 'সম্পত্তি হস্তান্তর আইন ১৮৮২ এর ধারা ৫২ (Lis Pendens) অনুযায়ী বিচারাধীন মামলায় জমি কেনার ঝুঁকি কী?',
    rule: 'Transfer of Property Act 1882 (Sec. 52)',
  },
  {
    icon: '📜',
    titleEn: 'Khatian Dag Plot Matching',
    titleBn: 'খতিয়ানের দাগ নম্বর গরমিল ও যাচাই',
    promptEn: 'What does a Dag number mismatch between a Saf Kabala deed and RS Khatian indicate?',
    promptBn: 'সাফ কবলা দলিলের তফসিলের সাথে আরএস খতিয়ানের দাগ নম্বরের গরমিল থাকলে করণীয় কী?',
    rule: 'TPA 1882 (Sec. 54) & Reg Act (Sec. 17)',
  },
];

export default function ChatPage() {
  const { lang, setLang } = useLang();

  // Sessions & Active Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Input & Attachment States
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Modal & Inspector States
  const [activeCitationSection, setActiveCitationSection] = useState<CorpusSection | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  // ── 1. INITIALIZE SESSIONS FROM LOCALSTORAGE ──────────────────
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(STORAGE_SESSIONS_KEY);
        let parsedSessions: ChatSession[] = [];
        if (stored) {
          parsedSessions = JSON.parse(stored);
        }

        if (!parsedSessions || parsedSessions.length === 0) {
          const initialSession: ChatSession = {
            id: makeId('session'),
            title: lang === 'bn' ? 'নতুন কথোপকথন' : 'New Property Examination',
            createdAt: nowTimestamp(),
            messages: [],
          };
          parsedSessions = [initialSession];
          localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(parsedSessions));
        }

        setSessions(parsedSessions);

        const savedActiveId = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
        if (savedActiveId && parsedSessions.some((s) => s.id === savedActiveId)) {
          setActiveSessionId(savedActiveId);
        } else {
          setActiveSessionId(parsedSessions[0].id);
        }
      } catch (err) {
        console.warn('Could not load sessions:', err);
      }
    });
  }, [lang]);

  // Save sessions to localStorage whenever they update
  const persistSessions = useCallback((updated: ChatSession[], newActiveId?: string) => {
    setSessions(updated);
    try {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated));
      if (newActiveId) {
        localStorage.setItem(ACTIVE_SESSION_ID_KEY, newActiveId);
      }
    } catch (err) {
      console.warn('Could not persist sessions:', err);
    }
  }, []);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );
  const messages = useMemo(() => activeSession?.messages || [], [activeSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Adjust textarea height dynamically
  const adjustTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // ── 2. NEW CHAT & SESSION SWITCHING ───────────────────────────
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: makeId('session'),
      title: lang === 'bn' ? 'নতুন কথোপকথন' : 'New Property Examination',
      createdAt: nowTimestamp(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    persistSessions(updated, newSession.id);
    setActiveSessionId(newSession.id);
    setInputText('');
    setAttachments([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      handleNewChat();
      return;
    }
    const nextActive = activeSessionId === id ? remaining[0].id : activeSessionId;
    persistSessions(remaining, nextActive);
    setActiveSessionId(nextActive);
  };

  // ── 3. FILE ATTACHMENTS (PICTURES & PDFS) ──────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      if (!isImg && !isPdf) {
        alert('Please attach JPG, PNG image scans or PDF deed documents.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newAttachment: ChatAttachment = {
          id: makeId('att'),
          name: file.name,
          type: isImg ? 'image' : 'pdf',
          size: file.size,
          dataUrl: isImg ? dataUrl : undefined,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        // Read small mock representation or text
        reader.readAsArrayBuffer(file.slice(0, 1024));
        const newAttachment: ChatAttachment = {
          id: makeId('att'),
          name: file.name,
          type: 'pdf',
          size: file.size,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      }
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Drag and Drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── 4. SEND MESSAGE & STREAMING SIMULATION ─────────────────────
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!content && attachments.length === 0) return;
    if (isStreaming) return;

    abortControllerRef.current = false;
    const currentAttachments = [...attachments];
    setInputText('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const currentNow = nowTimestamp();
    const userMessage: ChatMessage = {
      id: makeId('msg_user'),
      role: 'user',
      content: content || (currentAttachments.length > 0 ? `Uploaded ${currentAttachments.length} document file(s) for verification.` : ''),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: currentNow,
    };

    const assistantPlaceholderId = makeId('msg_asst');
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: currentNow,
    };

    // Update active session title if it's the first message
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    let sessionTitle = currentSession?.title || 'Property Examination';
    if (!currentSession || currentSession.messages.length === 0) {
      sessionTitle = content.length > 35 ? content.substring(0, 35) + '...' : content || currentAttachments[0]?.name || 'Document Examination';
    }

    const updatedMessages = [...messages, userMessage, assistantMessage];
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: sessionTitle,
          messages: updatedMessages,
        };
      }
      return s;
    });

    persistSessions(updatedSessions);
    setIsStreaming(true);

    try {
      let accumulatedText = '';
      const response = await sendChatMessage(
        [...messages, userMessage],
        lang,
        (chunk) => {
          if (abortControllerRef.current) return;
          accumulatedText += chunk;
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id === activeSessionId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, content: accumulatedText }
                      : m
                  ),
                };
              }
              return s;
            })
          );
        }
      );

      // Finalize with strictly verified citations
      setSessions((prev) => {
        const finalized = prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? {
                      ...m,
                      content: response.content,
                      citations: response.citations,
                    }
                  : m
              ),
            };
          }
          return s;
        });
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(finalized));
        return finalized;
      });
    } catch (err) {
      console.error('Error generating response:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const stopStreaming = () => {
    abortControllerRef.current = true;
    setIsStreaming(false);
  };

  // ── 5. STATUTORY CITATION INSPECTOR MODAL ─────────────────────
  const inspectCitation = (id: string) => {
    const canonical = resolveCanonicalId(id);
    const section = getCorpusSectionById(canonical);
    if (section) {
      setActiveCitationSection(section);
    }
  };

  // ── 6. UTILITIES: COPY, VOICE, EXPORT ─────────────────────────
  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setInputText((prev) => (prev ? prev + ' ' : '') + 'Saf Kabala deed registration deadline under section 23');
      }, 2500);
    }
  };

  const exportConversation = () => {
    if (!messages.length) return;
    const transcript = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role === 'user' ? 'COUNSEL' : 'NOTHI AI'}:\n${m.content}\n${
            m.citations?.length
              ? `CITATIONS: ${m.citations.map((c) => `${c.act} (${c.section})`).join(', ')}\n`
              : ''
          }`
      )
      .join('\n---\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nothi_AI_Chat_${activeSession.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="flex h-[calc(100vh-60px)] md:h-[calc(100vh-72px)] bg-[#f7f4ed] text-ink overflow-hidden select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── DRAG AND DROP FULLSCREEN OVERLAY ── */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-green-deep/80 backdrop-blur-xs flex flex-col items-center justify-center text-paper border-4 border-dashed border-brass pointer-events-none animate-in fade-in duration-150">
          <div className="text-5xl mb-3">📂</div>
          <h3 className="font-heading text-2xl font-bold">Drop Property Documents Here</h3>
          <p className="text-sm font-sans opacity-90 mt-1">
            Accepts deed scans (JPG, PNG) and Khatian ledgers (PDF) up to 15 MB
          </p>
        </div>
      )}

      {/* ── 1. COLLAPSIBLE GEMINI-STYLE SIDEBAR ── */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-paper border-r border-border flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-lg md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-ml-72'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Bar inside Sidebar: Logo & Collapse Button */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <Logo />
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-xs text-ink-muted hover:text-ink hover:bg-paper-dark"
              title="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* New Chat Button (Pill shaped, like Gemini) */}
          <div className="p-3">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-full bg-paper-dark hover:bg-border/60 text-ink font-sans text-sm font-semibold transition-all border border-border shadow-xs cursor-pointer active:scale-98"
            >
              <span className="text-lg leading-none font-bold text-green-deep">+</span>
              <span>{lang === 'bn' ? 'নতুন কথোপকথন' : 'New chat'}</span>
            </button>
          </div>

          {/* Recent Conversations List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              {lang === 'bn' ? 'সাম্প্রতিক পরীক্ষণ' : 'Recent Examinations'}
            </div>

            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer ${
                    isActive
                      ? 'bg-green-deep text-paper font-semibold shadow-xs'
                      : 'text-ink hover:bg-paper-dark/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-sm shrink-0">{isActive ? '💬' : '📄'}</span>
                    <span className="truncate">{session.title}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded-xs transition-opacity hover:text-vermillion ${
                      isActive ? 'text-paper hover:bg-white/20' : 'text-ink-muted hover:bg-paper'
                    }`}
                    title="Delete chat"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer: Corpus Badge & Home Link */}
          <div className="p-3 border-t border-border bg-paper-light space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded-xs bg-paper border border-border">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-deep" />
                <span className="text-ink font-semibold">Corpus Active</span>
              </span>
              <span className="text-ink-muted">28 Sections</span>
            </div>

            <Link
              href="/"
              className="flex items-center justify-between px-3 py-2 rounded-xs text-xs font-sans text-ink-muted hover:text-ink hover:bg-paper transition-colors"
            >
              <span>← {lang === 'bn' ? 'হোমপেজে ফিরুন' : 'Back to Home'}</span>
              <span className="font-mono text-[10px]">Nothi AI</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── 2. MAIN CHAT WORKSPACE AREA ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Workspace Top Header Bar */}
        <header className="h-14 border-b border-border bg-paper/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-ink hover:bg-paper-dark transition-colors cursor-pointer"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Model Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-paper-dark border border-border text-xs font-sans font-semibold text-green-deep">
              <span>✦</span>
              <span>Nothi AI 1.0 (Statutory Land Law)</span>
              <span className="hidden sm:inline text-[10px] font-mono text-ink-muted font-normal">
                • 28 Sections
              </span>
            </div>
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2">
            {/* Bilingual Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="px-2.5 py-1 rounded-xs border border-border bg-paper text-xs font-sans hover:bg-paper-dark transition-colors cursor-pointer"
              title="Toggle language"
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>

            {/* Export conversation */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={exportConversation}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs border border-border bg-paper text-xs font-sans text-ink hover:bg-paper-dark transition-colors cursor-pointer"
                title="Download conversation transcript"
              >
                <span>📥</span>
                <span>Export</span>
              </button>
            )}

            {/* New Chat Shortcut */}
            <button
              type="button"
              onClick={handleNewChat}
              className="p-1.5 rounded-xs border border-border bg-paper text-ink hover:bg-paper-dark transition-colors cursor-pointer"
              title="New Chat"
            >
              ＋
            </button>
          </div>
        </header>

        {/* ── 3. CHAT CONTENT AREA (MESSAGES OR EMPTY GREETING) ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            /* Gemini-Style Empty State */
            <div className="max-w-3xl mx-auto h-full flex flex-col justify-center py-8 space-y-8 animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-brass uppercase tracking-wider">
                  <span>✦ Bangladesh Property Vetting Intelligence</span>
                </div>
                <h1 className="font-heading text-4xl sm:text-5xl font-bold text-green-deep tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-deep via-green-mid to-brass">
                    {lang === 'bn' ? 'আসসালামু আলাইকুম, বিজ্ঞ আইনজীবী' : 'Hello, Counselor'}
                  </span>
                </h1>
                <p className="font-sans text-base sm:text-lg text-ink-muted leading-relaxed">
                  {lang === 'bn'
                    ? 'দলিল, খতিয়ান বা এনআইডির ছবি/পিডিএফ আপলোড করুন অথবা সংবিধিবদ্ধ আইন সংক্রান্ত যে কোনো প্রশ্ন জিজ্ঞাসা করুন।'
                    : 'Drop property deed scans, Khatian ledgers, or NID photos. Nothi AI answers with mathematical grounding in 28 statutory sections.'}
                </p>
              </div>

              {/* 4 Interactive Gemini Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {SUGGESTED_CARDS.map((card, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(lang === 'bn' ? card.promptBn : card.promptEn)}
                    className="group p-4 rounded-2xl bg-paper border border-border hover:border-brass/70 hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{card.icon}</span>
                      <span className="text-[10px] font-mono text-ink-muted group-hover:text-green-deep font-semibold">
                        {card.rule}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-sans text-xs font-bold text-ink group-hover:text-green-deep transition-colors">
                        {lang === 'bn' ? card.titleBn : card.titleEn}
                      </div>
                      <p className="font-sans text-xs text-ink-muted line-clamp-2">
                        {lang === 'bn' ? card.promptBn : card.promptEn}
                      </p>
                    </div>

                    <div className="text-[11px] font-mono text-brass group-hover:translate-x-1 transition-transform">
                      {lang === 'bn' ? 'প্রশ্ন করুন →' : 'Ask this →'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message List */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    {/* Role Label & Timestamp */}
                    <div className="text-[10px] font-mono text-ink-muted px-1 flex items-center gap-2">
                      <span>{isUser ? 'Counsel' : 'Nothi AI'}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`relative max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 text-sm font-sans leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-green-deep text-paper rounded-tr-xs'
                          : 'bg-paper text-ink border border-border rounded-tl-xs shadow-sm'
                      }`}
                    >
                      {/* Attached Documents in User Messages */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <div className="text-xs font-mono opacity-80 pb-1 border-b border-white/20">
                            Attached Document Bundle ({msg.attachments.length}):
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 border border-white/10"
                              >
                                {att.type === 'image' && att.dataUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => setLightboxImage(att.dataUrl!)}
                                    className="cursor-zoom-in group/img relative"
                                    title="Click to inspect image scan"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={att.dataUrl}
                                      alt={att.name}
                                      className="w-12 h-12 object-cover rounded-md border border-white/30"
                                    />
                                    <span className="absolute inset-0 bg-black/30 rounded-md opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[10px] text-white">
                                      🔍
                                    </span>
                                  </button>
                                ) : (
                                  <div className="w-10 h-10 rounded-md bg-vermillion/40 text-paper font-mono text-xs flex items-center justify-center font-bold">
                                    PDF
                                  </div>
                                )}
                                <div className="text-left text-xs">
                                  <div className="font-semibold truncate max-w-[140px]">{att.name}</div>
                                  <div className="text-[10px] opacity-75 font-mono">
                                    {(att.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="whitespace-pre-wrap leading-relaxed select-text">
                        {msg.content || (
                          <span className="inline-flex items-center gap-1.5 text-ink-muted">
                            <span className="w-2 h-2 rounded-full bg-brass animate-pulse" />
                            <span>Examining statutory corpus...</span>
                          </span>
                        )}
                      </div>

                      {/* Interactive Citation Chips (Strictly Verified) */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-ink-muted font-bold">
                            Verified Citations:
                          </span>
                          {msg.citations.map((c, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => inspectCitation(c.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-green-deep/10 text-green-deep border border-green-deep/30 hover:bg-green-deep hover:text-paper transition-all cursor-pointer shadow-2xs"
                              title="Click to view verbatim statutory text"
                            >
                              <span>✓</span>
                              <span>{c.act} {c.section ? `(${c.section})` : ''}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assistant Action Bar (Copy, Thumbs, Speak) */}
                    {!isUser && msg.content && (
                      <div className="flex items-center gap-2 px-1 text-ink-muted text-xs">
                        <button
                          type="button"
                          onClick={() => copyMessage(msg.id, msg.content)}
                          className="hover:text-ink transition-colors p-1 rounded-sm"
                          title="Copy response"
                        >
                          {copiedMessageId === msg.id ? '✓ Copied' : '📋 Copy'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setFeedbackState((prev) => ({
                              ...prev,
                              [msg.id]: prev[msg.id] === 'up' ? undefined! : 'up',
                            }))
                          }
                          className={`p-1 rounded-sm hover:text-ink transition-colors ${
                            feedbackState[msg.id] === 'up' ? 'text-green-deep font-bold' : ''
                          }`}
                          title="Good response"
                        >
                          👍
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setFeedbackState((prev) => ({
                              ...prev,
                              [msg.id]: prev[msg.id] === 'down' ? undefined! : 'down',
                            }))
                          }
                          className={`p-1 rounded-sm hover:text-ink transition-colors ${
                            feedbackState[msg.id] === 'down' ? 'text-vermillion font-bold' : ''
                          }`}
                          title="Poor response"
                        >
                          👎
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── 4. GEMINI-STYLE RICH FLOATING INPUT BAR ── */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed] to-transparent shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Input Box Card */}
            <div className="relative rounded-3xl bg-paper border-2 border-border shadow-lg p-3 sm:p-4 focus-within:border-green-deep/70 focus-within:shadow-xl transition-all">
              {/* Attachment Previews Tray */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-3 mb-2 border-b border-border">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-paper-dark border border-border text-xs font-sans text-ink"
                    >
                      {att.type === 'image' && att.dataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-8 h-8 object-cover rounded-md"
                        />
                      ) : (
                        <span className="w-8 h-8 rounded-md bg-vermillion/20 text-vermillion font-mono font-bold text-[10px] flex items-center justify-center">
                          PDF
                        </span>
                      )}
                      <div className="text-left">
                        <div className="font-semibold truncate max-w-[120px]">{att.name}</div>
                        <div className="text-[10px] text-ink-muted font-mono">
                          {(att.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="ml-1 text-ink-muted hover:text-vermillion p-1 font-bold"
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  setInputText(e.target.value);
                  adjustTextarea();
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  lang === 'bn'
                    ? 'দলিল বা খতিয়ান সংক্রান্ত প্রশ্ন লিখুন, অথবা ছবি ও পিডিএফ ড্রপ করুন...'
                    : 'Ask about property law, deed timelines, or upload deed scans & PDFs...'
                }
                rows={1}
                className="w-full bg-transparent resize-none outline-hidden font-sans text-sm text-ink placeholder:text-ink-muted/70 leading-relaxed max-h-44"
              />

              {/* Input Action Controls (Upload, Mic, Send) */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full text-ink-muted hover:text-green-deep hover:bg-paper-dark transition-colors cursor-pointer"
                    title="Upload picture or PDF document"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>

                  {/* Microphone / Speech Dictation */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isRecording
                        ? 'bg-vermillion text-paper animate-pulse'
                        : 'text-ink-muted hover:text-green-deep hover:bg-paper-dark'
                    }`}
                    title="Voice dictation"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                    </svg>
                  </button>
                </div>

                {/* Right controls: Stop or Send */}
                <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={stopStreaming}
                      className="px-3 py-1.5 rounded-full bg-vermillion text-paper font-sans text-xs font-semibold hover:bg-vermillion-light transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>■</span>
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim() && attachments.length === 0}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        inputText.trim() || attachments.length > 0
                          ? 'bg-green-deep text-paper shadow-md hover:bg-green-mid active:scale-95'
                          : 'bg-paper-dark text-ink-muted/40 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <p className="text-center text-[11px] font-sans text-ink-muted">
              Nothi AI is grounded in 28 verified sections of Bangladesh property law. Verify statutory citations before filing.
            </p>
          </div>
        </div>
      </main>

      {/* ── 5. STATUTORY VERBATIM INSPECTION MODAL ── */}
      {activeCitationSection && (
        <DrawerDetailModal
          section={activeCitationSection}
          citationId={activeCitationSection.id}
          onClose={() => setActiveCitationSection(null)}
        />
      )}

      {/* ── 6. IMAGE LIGHTBOX MODAL ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Enlarged document preview"
              className="rounded-lg shadow-2xl object-contain max-h-[85vh] mx-auto border-2 border-white/20"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-black/70 text-white font-mono text-xs hover:bg-black cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
