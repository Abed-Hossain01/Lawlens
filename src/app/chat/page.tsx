'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
  KeyboardEvent,
  DragEvent,
  ChangeEvent,
} from 'react';
import Link from 'next/link';
import { useLang } from '@/lib/lang';
import { AnimatedLogo, LogoState } from '@/components/chat/AnimatedLogo';
import { CorpusListModal } from '@/components/chat/CorpusListModal';
import { CitationPopover } from '@/components/chat/CitationPopover';
import { ThinkingStageIndicator, PipelineStage } from '@/components/chat/ThinkingStageIndicator';
import { StreamingTextRenderer } from '@/components/chat/StreamingTextRenderer';
import { VoiceInputButton } from '@/components/chat/VoiceInputButton';
import { ChatSessionMenu } from '@/components/chat/ChatSessionMenu';
import { DrawerDetailModal } from '@/components/landing/citation-gate/DrawerDetailModal';
import { useAuth } from '@/lib/auth';
import { SignInModal } from '@/components/auth/SignInModal';
import { sendChatMessage, ChatMessage, ChatAttachment, ChatCitation } from '@/lib/chat';
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

const STORAGE_SESSIONS_KEY = 'nothi_ai_sessions_v4';
const ACTIVE_SESSION_ID_KEY = 'nothi_ai_active_session_id';

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

// 4 Plain Text Suggestions for Clerk's Reading Room Empty State
const EMPTY_SUGGESTIONS = [
  {
    textEn: 'How long can pass between signing and registering a Saf Kabala deed?',
    textBn: 'সাফ কবলা দলিল সম্পাদনের পর কতদিনের মধ্যে তা রেজিস্ট্রি করতে হবে?',
  },
  {
    textEn: 'What makes an NID number valid?',
    textBn: 'জাতীয় পরিচয়পত্র (এনআইডি) নম্বর কী কারণে সংবিধিবদ্ধভাবে বৈধ হয়?',
  },
  {
    textEn: 'What does a Dag number mismatch mean?',
    textBn: 'দলিল ও খতিয়ানের দাগ নম্বরের গরমিলের আইনি ফলাফল কী?',
  },
  {
    textEn: 'What is a Khatian used for?',
    textBn: 'সম্পত্তি হস্তান্তরে খতিয়ান (স্বত্বলিপির) মূল ভূমিকা কী?',
  },
];

// Contextual follow-up chips (max 2 per assistant answer)
function getFollowUpChips(content: string, lang: 'en' | 'bn'): string[] {
  const lower = content.toLowerCase();
  if (lower.includes('23') || lower.includes('four month') || lower.includes('৪ মাস') || lower.includes('presentation')) {
    return lang === 'bn'
      ? ['ধারা ২৪ এর অধীনে বিলম্ব কি মওকুফযোগ্য?', 'দেরিতে দলিলের জন্য শাস্তি কী?']
      : ['Can Section 24 extend this deadline?', 'What are the penalties for late presentation?'];
  }
  if (lower.includes('nid') || lower.includes('স্মার্ট') || lower.includes('পরিচয়পত্র') || lower.includes('rule 3')) {
    return lang === 'bn'
      ? ['৯-সংখ্যার এনআইডি কি বৈধ?', 'বিধি ৫ কীভাবে নাম যাচাই করে?']
      : ['Can a 9-digit NID be verified?', 'How does Rule 5 check party names?'];
  }
  if (lower.includes('dag') || lower.includes('দাগ') || lower.includes('mismatch')) {
    return lang === 'bn'
      ? ['দাগ নম্বরের গরমিল কীভাবে সংশোধন করা যায়?', 'আরএস ও বিএস খতিয়ানের পার্থক্য কী?']
      : ['How to rectify a Dag mismatch?', 'What is the difference between RS and BS Khatians?'];
  }
  if (lower.includes('khatian') || lower.includes('খতিয়ান')) {
    return lang === 'bn'
      ? ['নামজারি খতিয়ান কীভাবে যাচাই হয়?', 'দলিলের আগে খতিয়ান কেন বাধ্যতামূলক?']
      : ['How is a Mutation Khatian verified?', 'Why is Khatian compulsory before deed registration?'];
  }
  return lang === 'bn'
    ? ['কোন দলিলগুলো বাধ্যতামূলকভাবে রেজিস্ট্রি করতে হয়?', 'লিস পেনডেন্স নীতি কীভাবে প্রযোজ্য?']
    : ['What documents are compulsorily registered?', 'How does Lis Pendens affect title?'];
}

export default function ChatPage() {
  const { lang, setLang } = useLang();
  const { user } = useAuth();
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  // Sessions & Active Chat State (clean state initialization without effect-cascading)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'session_init',
        title: 'Property Examination',
        createdAt: 0,
        messages: [],
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'session_init';
    try {
      const savedActiveId = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
      if (savedActiveId) return savedActiveId;
      const stored = localStorage.getItem(STORAGE_SESSIONS_KEY);
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return 'session_init';
  });
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setIsDesktopSidebarCollapsed((prev) => !prev);
    } else {
      setIsMobileDrawerOpen((prev) => !prev);
    }
  };

  // Input & Attachment States
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<
    (ChatAttachment & { uploadProgress?: number })[]
  >([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pipeline Thinking & Streaming States
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<PipelineStage>('reading');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [logoState, setLogoState] = useState<LogoState>('idle');

  // Modal & Inspector States
  const [activeCitationSection, setActiveCitationSection] = useState<CorpusSection | null>(null);
  const [corpusListOpen, setCorpusListOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // DOM Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<boolean>(false);



  const persistSessions = useCallback(
    (newSessions: ChatSession[]) => {
      setSessions(newSessions);
      try {
        localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(newSessions));
      } catch (e) {
        console.warn('Unable to persist chat sessions to localStorage:', e);
      }
    },
    []
  );

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || {
      id: 'default',
      title: 'Property Examination',
      createdAt: 0,
      messages: [],
    };
  }, [sessions, activeSessionId]);

  const messages = activeSession.messages;

  // ── 2. AUTO-SCROLL TO BOTTOM ──────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [activeSessionId, scrollToBottom]);

  useEffect(() => {
    if (isStreaming || isThinking) {
      scrollToBottom(false);
    }
  }, [streamingText, isThinking, isStreaming, scrollToBottom]);

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 240);
  };

  // Auto-grow textarea (1 to 6 lines)
  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 160);
    el.style.height = `${newHeight}px`;
  };

  // ── 3. SESSION MANAGEMENT ─────────────────────────────────────
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: makeId('session'),
      title: 'New Examination',
      createdAt: nowTimestamp(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    persistSessions(updated);
    setActiveSessionId(newSession.id);
    try {
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, newSession.id);
    } catch {}
    setInputText('');
    setAttachments([]);
    setAttachmentError(null);
    setStreamingText('');
    setIsStreaming(false);
    setIsThinking(false);
    setLogoState('idle');
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileDrawerOpen(false);
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    try {
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
    } catch {}
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileDrawerOpen(false);
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s));
    persistSessions(updated);
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }
    const updated = sessions.filter((s) => s.id !== id);
    persistSessions(updated);
    const nextActive = updated[0].id;
    setActiveSessionId(nextActive);
  };

  // ── 4. DATE GROUPING FOR CONVERSATION LIST (Today, Yesterday, Earlier) ──
  const groupedSessions = useMemo(() => {
    if (!mounted) {
      return sessions.length > 0 ? [{ label: 'Conversations', items: sessions }] : [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; items: ChatSession[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier', items: [] },
    ];

    sessions.forEach((s) => {
      const date = new Date(s.createdAt);
      if (date >= today) groups[0].items.push(s);
      else if (date >= yesterday) groups[1].items.push(s);
      else groups[2].items.push(s);
    });

    return groups.filter((g) => g.items.length > 0);
  }, [sessions, mounted]);

  // ── 5. FILE ATTACHMENTS (MAX 3, 15MB EACH) ────────────────────
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    const maxFiles = 3;
    const maxSize = 15 * 1024 * 1024; // 15 MB

    if (attachments.length + files.length > maxFiles) {
      setAttachmentError(`Maximum ${maxFiles} documents allowed per message.`);
      return;
    }

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      if (!isImg && !isPdf) {
        setAttachmentError(`"${file.name}" is not a valid format. Only PDF, JPG, and PNG are supported.`);
        return;
      }

      if (file.size > maxSize) {
        setAttachmentError(`"${file.name}" exceeds 15 MB size limit.`);
        return;
      }

      const tempId = makeId('att');
      const reader = new FileReader();

      // Show immediate progress card
      setAttachments((prev) => [
        ...prev,
        {
          id: tempId,
          name: file.name,
          type: isImg ? 'image' : 'pdf',
          size: file.size,
          uploadProgress: 45,
        },
      ]);

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setAttachments((prev) =>
          prev.map((a) =>
            a.id === tempId
              ? {
                  ...a,
                  uploadProgress: 100,
                  dataUrl: isImg ? dataUrl : undefined,
                }
              : a
          )
        );
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file.slice(0, 512));
      }
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Meaningful auto-titling from question (max 40 chars, never "hi")
  const generateMeaningfulTitle = (content: string, firstFileName?: string): string => {
    const lower = content.toLowerCase().trim();
    if (lower === 'hi' || lower === 'hello' || lower === 'hey') {
      return 'Property Inquiry';
    }
    if (lower.includes('23') || lower.includes('signing and registering') || lower.includes('presentation')) {
      return 'Deed Presentation Window (Sec. 23)';
    }
    if (lower.includes('nid') || lower.includes('identity') || lower.includes('rule 3')) {
      return 'NID Digit Parity Check';
    }
    if (lower.includes('dag') || lower.includes('plot') || lower.includes('mismatch')) {
      return 'Dag Number Schedule Parity';
    }
    if (lower.includes('khatian') || lower.includes('porcha')) {
      return 'Collectorate Khatian Title Chain';
    }
    if (lower.includes('lis pendens') || lower.includes('suit') || lower.includes('52')) {
      return 'Lis Pendens Litigation Check (Sec. 52)';
    }
    if (lower.includes('forged') || lower.includes('fake') || lower.includes('crime')) {
      return 'Forged Deed Penal Liabilities';
    }
    if (firstFileName) {
      return `Vetting: ${firstFileName.substring(0, 30)}`;
    }
    // Clean, sanitize, take first 38 characters
    const cleaned = content.replace(/[^a-zA-Z0-9\u0980-\u09FF\s]/g, '').trim();
    if (cleaned.length > 3) {
      return cleaned.substring(0, 38) + (cleaned.length > 38 ? '...' : '');
    }
    return 'Property Examination';
  };

  // ── 6. THINKING PIPELINE & STREAMING LOGIC ────────────────────
  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!content && attachments.length === 0) return;
    if (isStreaming || isThinking) return;

    abortControllerRef.current = false;
    const currentAttachments = [...attachments];
    setInputText('');
    setAttachments([]);
    setAttachmentError(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const currentNow = nowTimestamp();
    const userMessage: ChatMessage = {
      id: makeId('msg_user'),
      role: 'user',
      content: content || (currentAttachments.length > 0 ? `Uploaded ${currentAttachments.length} document file(s) for examination.` : ''),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      timestamp: currentNow,
    };

    // Auto-title session if this is the first message
    const isFirst = messages.length === 0;
    const newTitle = isFirst ? generateMeaningfulTitle(content, currentAttachments[0]?.name) : activeSession.title;

    // Immediately append user message
    const updatedMessagesWithUser = [...messages, userMessage];
    const updatedSessionsWithUser = sessions.map((s) =>
      s.id === activeSessionId
        ? { ...s, title: newTitle, messages: updatedMessagesWithUser }
        : s
    );
    persistSessions(updatedSessionsWithUser);

    // ── STAGE 1: 4-STAGE THINKING SEQUENCE (>=500ms each) ───────
    setIsThinking(true);
    setLogoState('thinking');
    setIsErrorState(false);

    setThinkingStage('reading');
    await new Promise((r) => setTimeout(r, 520));
    if (abortControllerRef.current) return;

    setThinkingStage('searching');
    await new Promise((r) => setTimeout(r, 560));
    if (abortControllerRef.current) return;

    setThinkingStage('checking');
    await new Promise((r) => setTimeout(r, 520));
    if (abortControllerRef.current) return;

    setThinkingStage('writing');
    await new Promise((r) => setTimeout(r, 500));
    if (abortControllerRef.current) return;

    // ── STAGE 2: STREAMING WORD-BY-WORD (40-60 wps) ─────────────
    setIsThinking(false);
    setIsStreaming(true);
    setStreamingText('');

    let accumulatedText = '';
    let responseCitations: ChatCitation[] = [];

    try {
      const response = await sendChatMessage(
        updatedMessagesWithUser,
        lang,
        (chunk) => {
          if (abortControllerRef.current) return;
          accumulatedText += chunk;
          setStreamingText(accumulatedText);
        }
      );

      responseCitations = response.citations;

      // Check if out-of-corpus error
      if (response.citations.length === 0 && response.content.includes('cannot find this topic')) {
        setLogoState('error');
        await new Promise((r) => setTimeout(r, 600));
      } else {
        setLogoState('answered');
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      console.error('Error in sendChatMessage:', err);
      setIsErrorState(true);
      setLogoState('error');
    } finally {
      setIsStreaming(false);

      if (!abortControllerRef.current) {
        const assistantMessage: ChatMessage = {
          id: makeId('msg_asst'),
          role: 'assistant',
          content: accumulatedText,
          citations: responseCitations,
          timestamp: nowTimestamp(),
        };

        const finalizedMessages = [...updatedMessagesWithUser, assistantMessage];
        const finalizedSessions = sessions.map((s) =>
          s.id === activeSessionId ? { ...s, messages: finalizedMessages } : s
        );
        persistSessions(finalizedSessions);
        setStreamingText('');
        setLogoState('idle');
      }
    }
  };

  const handleStop = () => {
    abortControllerRef.current = true;
    setIsThinking(false);
    setIsStreaming(false);

    if (streamingText.trim()) {
      const partialMessage: ChatMessage = {
        id: makeId('msg_asst_stopped'),
        role: 'assistant',
        content: streamingText + ' [Stopped]',
        citations: [],
        timestamp: nowTimestamp(),
      };
      const finalized = [...messages, partialMessage];
      const updated = sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: finalized } : s
      );
      persistSessions(updated);
    }
    setStreamingText('');
    setLogoState('idle');
  };

  const handleRegenerate = async (lastUserText: string) => {
    handleSendMessage(lastUserText);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div
      className="flex flex-col h-[100dvh] bg-[#F6F1E7] text-ink overflow-hidden select-none font-sans"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── DRAG AND DROP FULLSCREEN OVERLAY (NO EMOJI) ── */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-[#1B4332]/90 backdrop-blur-xs flex flex-col items-center justify-center text-paper border-4 border-dashed border-brass pointer-events-none animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-full bg-paper/10 flex items-center justify-center mb-3 text-brass">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="font-heading text-2xl font-bold">Drop property documents here</h3>
          <p className="text-sm font-sans text-paper/80 mt-1">
            Accepts Saf Kabala deed scans, Khatian ledgers, and NID cards (PDF, JPG, PNG up to 15 MB)
          </p>
        </div>
      )}

      {/* ── 1. SINGLE AUTHORITATIVE HEADER (NO SECOND LOGO / TOGGLE) ── */}
      <header className="h-[60px] md:h-[64px] border-b border-border/80 bg-[#FAF7F2] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        {/* Left: Sidebar Toggle + Nothi AI Logo & Wordmark */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 sm:p-2 rounded-xs border border-border/70 text-ink hover:bg-paper-dark transition-colors cursor-pointer"
            title="Toggle conversation sidebar"
            aria-label="Toggle conversation sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="no-underline flex items-center gap-2 group" aria-label="Nothi AI Home">
            <AnimatedLogo state={logoState} size={24} />
            <span className="font-heading text-lg sm:text-xl font-bold text-green-deep tracking-tight">
              Nothi AI
            </span>
            <span className="hidden sm:inline font-bangla text-base text-ink-muted/80 ml-0.5">
              নথি এআই
            </span>
          </Link>
        </div>

        {/* Center: Quiet 28 Verified Sections Link (Desktop) */}
        <div className="hidden md:flex items-center">
          <button
            type="button"
            onClick={() => setCorpusListOpen(true)}
            className="inline-flex items-center gap-2 text-xs font-sans text-ink-muted hover:text-green-deep transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-paper-dark/60"
            title="View 28 verified sections from laws_corpus.json"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-deep" />
            <span>28 verified sections</span>
          </button>
        </div>

        {/* Right Controls: Single EN / বাং Switch, Sign In/Profile, Back to site */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Single Header EN / বাং Language Toggle */}
          <div
            role="radiogroup"
            aria-label="Select interface language"
            className="inline-flex p-0.5 rounded-full border border-border/80 bg-paper-dark/60"
          >
            <button
              type="button"
              role="radio"
              aria-checked={lang === 'en'}
              onClick={() => setLang('en')}
              className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-green-deep text-paper font-semibold shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={lang === 'bn'}
              onClick={() => setLang('bn')}
              className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bangla transition-all cursor-pointer ${
                lang === 'bn'
                  ? 'bg-green-deep text-paper font-semibold shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              বাং
            </button>
          </div>

          {/* User Sign In / Profile Pill */}
          {user ? (
            <button
              type="button"
              onClick={() => setSignInModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-border/80 bg-paper hover:bg-paper-dark text-xs font-sans text-ink shadow-2xs hover:border-brass/70 transition-all cursor-pointer"
              title={`Signed in as ${user.name}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="max-w-[70px] sm:max-w-[120px] truncate">{user.name.replace('Advocate ', 'Adv. ')}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSignInModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full border border-border/80 bg-paper hover:bg-paper-dark text-xs font-sans text-ink hover:text-green-deep transition-all cursor-pointer shadow-2xs"
              title="Sign in with your email"
            >
              <span>{lang === 'bn' ? 'লগইন' : 'Sign in'}</span>
            </button>
          )}

          {/* Back to Site Link */}
          <Link
            href="/"
            className="text-xs font-sans text-ink-muted hover:text-green-deep px-1.5 sm:px-2 py-1 transition-colors whitespace-nowrap"
            title="Return to Nothi AI landing page"
          >
            {lang === 'bn' ? 'মূল সাইট' : 'Back to site'}
          </Link>
        </div>
      </header>

      {/* ── 2. WORKSPACE BODY: SIDEBAR + CONVERSATION COLUMN ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {isMobileDrawerOpen && (
          <div
            className="fixed inset-0 z-30 bg-ink/30 md:hidden backdrop-blur-2xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
        )}

        {/* ── 2A. LEFT SIDEBAR (COLLAPSIBLE 280PX, SLIDE-OVER ON MOBILE) ── */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-[280px] bg-[#FAF7F2] border-r border-border/80 flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-lg md:shadow-none shrink-0 ${
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            isDesktopSidebarCollapsed ? 'md:-ml-[280px]' : 'md:translate-x-0 md:ml-0'
          }`}
          style={{ top: '60px', height: 'calc(100dvh - 60px)' }}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Top Button: "+ New chat" */}
            <div className="p-3 border-b border-border/80">
              <button
                type="button"
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-deep hover:bg-green-mid text-paper font-sans text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <span className="text-base leading-none font-bold">+</span>
                <span>{lang === 'bn' ? 'নতুন আলাপ' : 'New chat'}</span>
              </button>
            </div>

            {/* Conversation List Grouped by Today / Yesterday / Earlier */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
              {groupedSessions.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="px-3 text-[11px] font-sans font-semibold text-ink-muted/80 uppercase tracking-wider">
                    {group.label}
                  </div>

                  {group.items.map((session) => {
                    const isActive = session.id === activeSessionId;

                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                          isActive
                            ? 'bg-paper-dark/80 border-l-2 border-green-deep text-green-deep font-semibold shadow-2xs'
                            : 'text-ink hover:bg-paper-dark/40'
                        }`}
                      >
                        <span className="truncate pr-2">{session.title}</span>

                        {/* Three dots menu */}
                        <ChatSessionMenu
                          sessionId={session.id}
                          sessionTitle={session.title}
                          onRename={handleRenameSession}
                          onDelete={handleDeleteSession}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Sidebar Safe Footer: One disclaimer text link only (laws_corpus.json) */}
            <div className="p-4 border-t border-border/80 text-center pb-8 safe-bottom">
              <button
                type="button"
                onClick={() => setCorpusListOpen(true)}
                className="text-xs font-mono text-ink-muted hover:text-green-deep transition-colors cursor-pointer"
                title="View verified statutory corpus"
              >
                laws_corpus.json
              </button>
            </div>
          </div>
        </aside>

        {/* ── 2B. MAIN CONVERSATION COLUMN (CENTERED MAX 760PX) ── */}
        <main
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#F6F1E7]"
          role="log"
          aria-live="polite"
        >
          <div className="flex-1 flex flex-col justify-between max-w-[760px] mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
            {/* ── EMPTY STATE (CLERK'S READING ROOM) ── */}
            {messages.length === 0 && !isThinking && !isStreaming ? (
              <div className="my-auto py-8 sm:py-14 space-y-7 animate-in fade-in duration-300">
                {/* Greeting & Verification Subtitle */}
                <div className="space-y-3">
                  <h1 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-normal text-ink tracking-tight leading-tight">
                    {lang === 'bn' ? 'কী আইনি তথ্য যাচাই করতে চান?' : 'What would you like to check?'}
                  </h1>
                  <p className="font-sans text-base text-ink-muted leading-relaxed">
                    {lang === 'bn'
                      ? 'উত্তর কেবল বাংলাদেশ ভূমি আইনের ২৮টি যাচাইকৃত ধারার ভিত্তিতে দেওয়া হয়।'
                      : 'Answers come only from 28 verified sections of Bangladeshi property law.'}
                  </p>
                </div>

                {/* Four Plain Text Rows Separated by Thin Rules */}
                <div className="border-t border-border/80">
                  {EMPTY_SUGGESTIONS.map((item, idx) => {
                    const text = lang === 'bn' ? item.textBn : item.textEn;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(text)}
                        className="group w-full py-4 sm:py-4.5 border-b border-border/80 flex items-center justify-between text-left transition-colors hover:bg-paper-dark/30 px-2 -mx-2 rounded-sm cursor-pointer"
                      >
                        <span className="font-sans text-base text-ink group-hover:text-green-deep transition-colors pr-4 leading-snug">
                          {text}
                        </span>
                        <span className="text-ink-muted/60 group-hover:text-green-deep group-hover:translate-x-1.5 transition-all text-base shrink-0 select-none">
                          &rarr;
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── ACTIVE MESSAGE LIST ── */
              <div className="space-y-8 pb-4">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const isConsecutive = prevMsg?.role === msg.role;

                  return (
                    <div
                      key={msg.id}
                      className={`group flex flex-col ${
                        isUser ? 'items-end' : 'items-start'
                      } ${isConsecutive ? 'mt-2' : 'mt-6'}`}
                    >
                      {/* USER MESSAGE: Bottle-Green Filled Bubble (16px, Sender Flatter Corner, 80% Max Width) */}
                      {isUser ? (
                        <div className="max-w-[80%] rounded-2xl rounded-tr-xs bg-green-deep text-paper p-4 text-base font-sans leading-relaxed shadow-xs">
                          {/* Attached files inside message */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mb-3 space-y-1.5 pb-2 border-b border-paper/20">
                              {msg.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 p-1.5 rounded-xs bg-black/15 text-xs"
                                >
                                  {att.type === 'image' && att.dataUrl ? (
                                    <button
                                      type="button"
                                      onClick={() => setLightboxImage(att.dataUrl!)}
                                      className="cursor-zoom-in"
                                      title="Enlarge image"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={att.dataUrl}
                                        alt={att.name}
                                        className="w-10 h-10 object-cover rounded-xs border border-white/30"
                                      />
                                    </button>
                                  ) : (
                                    <span className="w-8 h-8 rounded-xs bg-vermillion/40 text-paper font-mono font-bold text-[10px] flex items-center justify-center">
                                      PDF
                                    </span>
                                  )}
                                  <div className="truncate">
                                    <div className="font-medium truncate">{att.name}</div>
                                    <div className="text-[10px] font-mono opacity-70">
                                      {(att.size / 1024).toFixed(1)} KB
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="whitespace-pre-wrap">{msg.content}</div>

                          <div className="mt-1 text-[10px] font-mono text-paper/70 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            {mounted &&
                              new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </div>
                        </div>
                      ) : (
                        /* ASSISTANT MESSAGE: Left-Aligned, NO Bubble Box, Directly on Paper Background */
                        <div className="w-full space-y-3 pl-0 sm:pl-1">
                          {/* Header: 24px AnimatedLogo Avatar + Nothi AI Label */}
                          <div className="flex items-center gap-2.5 text-xs font-sans text-ink">
                            <AnimatedLogo state="idle" size={24} />
                            <span className="font-semibold text-green-deep text-sm">Nothi AI</span>
                            <span className="text-[10px] font-mono text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity">
                              {mounted &&
                                `• ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          </div>

                          {/* Message Body: 16px Clean Sans Text */}
                          <div className="pl-8 sm:pl-8.5">
                            <StreamingTextRenderer
                              text={msg.content}
                              isStreaming={false}
                            />

                            {/* "Based on" Verified Citation Chips */}
                            {msg.citations && msg.citations.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-border/80 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-sans text-ink-muted">Based on:</span>
                                {msg.citations.map((c, cIdx) => (
                                  <CitationPopover
                                    key={cIdx}
                                    citation={c}
                                    index={cIdx}
                                    onInspect={(sec) => setActiveCitationSection(sec)}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Follow-up Chips (At most two chips) */}
                            {msg.content && (
                              <div className="mt-3.5 flex flex-wrap gap-2">
                                {getFollowUpChips(msg.content, lang).slice(0, 2).map((chip, chipIdx) => (
                                  <button
                                    key={chipIdx}
                                    type="button"
                                    onClick={() => handleSendMessage(chip)}
                                    className="text-xs font-sans px-3 py-1.5 rounded-full border border-border/80 bg-paper hover:border-brass hover:bg-paper-dark/60 text-ink transition-colors cursor-pointer"
                                  >
                                    <span>{chip}</span>
                                    <span className="ml-1 text-brass">&rarr;</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Assistant Actions Row (Copy, Regenerate, Thumbs - Clean SVGs, No Emojis) */}
                            <div className="mt-3 flex items-center gap-4 text-xs font-sans text-ink-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => copyMessage(msg.id, msg.content)}
                                className="hover:text-green-deep transition-colors cursor-pointer"
                              >
                                {copiedMessageId === msg.id ? '✓ Copied' : 'Copy'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                                  if (lastUser) handleRegenerate(lastUser.content);
                                }}
                                className="hover:text-green-deep transition-colors cursor-pointer"
                              >
                                Regenerate
                              </button>

                              <div className="flex items-center gap-1.5 border-l border-border/80 pl-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFeedbackState((prev) => ({
                                      ...prev,
                                      [msg.id]: prev[msg.id] === 'up' ? undefined! : 'up',
                                    }))
                                  }
                                  className={`p-1 hover:text-green-deep cursor-pointer transition-colors ${
                                    feedbackState[msg.id] === 'up' ? 'text-green-deep' : 'text-ink-muted'
                                  }`}
                                  title="Helpful"
                                  aria-label="Helpful"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill={feedbackState[msg.id] === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFeedbackState((prev) => ({
                                      ...prev,
                                      [msg.id]: prev[msg.id] === 'down' ? undefined! : 'down',
                                    }))
                                  }
                                  className={`p-1 hover:text-vermillion cursor-pointer transition-colors ${
                                    feedbackState[msg.id] === 'down' ? 'text-vermillion' : 'text-ink-muted'
                                  }`}
                                  title="Not helpful"
                                  aria-label="Not helpful"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill={feedbackState[msg.id] === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── 4-STAGE THINKING SEQUENCE (>=500ms EACH & SKELETON) ── */}
                {isThinking && (
                  <div className="w-full space-y-2 mt-4 pl-0 sm:pl-1">
                    <ThinkingStageIndicator
                      currentStage={thinkingStage}
                      isError={isErrorState}
                    />
                  </div>
                )}

                {/* ── WORD-BY-WORD STREAMING TRANSITION ── */}
                {isStreaming && (
                  <div className="w-full space-y-2 mt-4 pl-0 sm:pl-1">
                    <div className="flex items-center gap-2.5 text-xs font-sans text-ink">
                      <AnimatedLogo state="thinking" size={24} />
                      <span className="font-semibold text-green-deep text-sm">Nothi AI</span>
                    </div>

                    <div className="pl-8 sm:pl-8.5">
                      <StreamingTextRenderer
                        text={streamingText}
                        isStreaming={true}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Jump to Latest Floating Pill */}
            {showScrollBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom()}
                className="fixed bottom-24 right-6 sm:right-12 z-20 px-3 py-1.5 rounded-full bg-paper border border-border/80 text-ink text-xs font-sans shadow-md hover:bg-paper-dark transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>↓</span>
                <span>Jump to latest</span>
              </button>
            )}

            {/* ── 3. DOCKED BOTTOM INPUT BAR (ROUNDED 16PX, THIN BRASS BORDER) ── */}
            <div className="pt-4 sticky bottom-0 bg-[#F6F1E7]/95 backdrop-blur-md pb-4 z-10">
              <div className="rounded-[16px] bg-paper border border-brass/50 shadow-sm focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/20 transition-all p-3 space-y-2">
                {/* Upload Error Banner */}
                {attachmentError && (
                  <div className="px-3 py-1.5 rounded-xs bg-vermillion/10 border border-vermillion/30 text-vermillion text-xs font-sans flex items-center justify-between">
                    <span>{attachmentError}</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentError(null)}
                      className="font-bold ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Attached Files Tray with Thumbnail, Size, Progress, Remove */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-border/70">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xs bg-paper-dark border border-border text-xs font-sans text-ink"
                      >
                        {att.type === 'image' && att.dataUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-7 h-7 object-cover rounded-xs"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-xs bg-vermillion/20 text-vermillion font-mono font-bold text-[9px] flex items-center justify-center">
                            PDF
                          </span>
                        )}
                        <div className="truncate max-w-[130px]">
                          <div className="font-semibold truncate">{att.name}</div>
                          <div className="text-[10px] text-ink-muted font-mono flex items-center gap-1">
                            <span>{(att.size / 1024).toFixed(1)} KB</span>
                            <span className="text-green-deep">✓</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="ml-1 text-ink-muted hover:text-vermillion p-1 font-bold cursor-pointer"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Auto-growing Textarea (1 to 6 lines, 16px text) */}
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
                      ? 'দলিল বা সংবিধিবদ্ধ আইন সম্পর্কিত প্রশ্ন লিখুন...'
                      : 'Ask about a Bangladeshi property document...'
                  }
                  rows={1}
                  maxLength={1000}
                  className="w-full bg-transparent resize-none outline-hidden font-sans text-base text-ink placeholder:text-ink-muted/70 leading-relaxed max-h-40"
                />

                {/* Controls: Paperclip, Voice Input, Character Counter, Send/Stop */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    {/* Hidden File Picker (PDF, JPG, PNG up to 15MB, max 3) */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(e) => handleFiles(e.target.files)}
                      className="hidden"
                    />

                    {/* Paperclip Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-xs text-ink-muted hover:text-green-deep hover:bg-paper-dark transition-colors cursor-pointer"
                      title="Attach deed scan or PDF (up to 3 files, 15MB)"
                      aria-label="Attach file"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>

                    {/* Voice Input Button */}
                    <VoiceInputButton
                      lang={lang}
                      onTranscript={(transcript) =>
                        setInputText((prev) => (prev ? prev + ' ' : '') + transcript)
                      }
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Character Counter (appears only when approaching 1000 limit) */}
                    {inputText.length > 800 && (
                      <span className="font-mono text-[11px] text-ink-muted">
                        {inputText.length}/1000
                      </span>
                    )}

                    {/* Send or Stop Button */}
                    {isStreaming || isThinking ? (
                      <button
                        type="button"
                        onClick={handleStop}
                        className="px-3.5 py-1.5 rounded-xl bg-vermillion text-paper font-sans text-xs font-semibold hover:bg-vermillion/90 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <span>■</span>
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendMessage()}
                        disabled={!inputText.trim() && attachments.length === 0}
                        className={`px-4 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer ${
                          inputText.trim() || attachments.length > 0
                            ? 'bg-green-deep text-paper hover:bg-green-mid shadow-xs active:scale-95'
                            : 'bg-paper-dark text-ink-muted/50 cursor-not-allowed'
                        }`}
                      >
                        Send
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fixed Quiet 13px Legal Note */}
              <p className="text-center text-[13px] font-sans text-ink-muted pt-2.5">
                Nothi AI explains verified statutory sections. It does not replace a licensed advocate.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ── 4. CORPUS 28-SECTION LIST MODAL ── */}
      <CorpusListModal
        isOpen={corpusListOpen}
        onClose={() => setCorpusListOpen(false)}
        onSelectSection={(sec) => {
          setCorpusListOpen(false);
          setActiveCitationSection(sec);
        }}
      />

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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage}
              alt="Enlarged document preview"
              className="rounded-md shadow-2xl object-contain max-h-[85vh] mx-auto border border-white/20"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 px-3 py-1 rounded-xs bg-black/70 text-white font-mono text-xs hover:bg-black cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* ── 7. CHAMBER SIGN IN MODAL ── */}
      <SignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
      />
    </div>
  );
}
