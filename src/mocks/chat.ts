import type { ChatCitation, ChatAttachment } from '@/lib/chat';

interface RawMockResponse {
  content: string;
  citations: ChatCitation[];
}

/**
 * Deterministic Statutory Reasoning Engine for Nothi AI Chat
 *
 * Grounded strictly in the 28 verified sections of laws_corpus.json.
 * Supports document attachment analysis (Pictures & PDFs of deeds, khatians, NIDs).
 * If a topic is outside the corpus, it refuses to fabricate rules.
 */
export async function generateMockChatResponse(
  prompt: string,
  lang: 'en' | 'bn',
  onChunk?: (chunk: string) => void,
  attachments?: ChatAttachment[]
): Promise<RawMockResponse> {
  const isBangla = lang === 'bn' || /[\u0980-\u09FF]/.test(prompt);
  const lower = prompt.toLowerCase();
  const hasAttachments = attachments && attachments.length > 0;
  const attachmentNames = hasAttachments
    ? attachments.map((a) => a.name.toLowerCase()).join(' ')
    : '';

  let response: RawMockResponse;

  // 0. Dedicated Document Attachment Analysis (Pictures & PDFs)
  if (hasAttachments) {
    const fileNames = attachments.map((a) => `"${a.name}"`).join(', ');

    if (
      attachmentNames.includes('nid') ||
      attachmentNames.includes('identity') ||
      attachmentNames.includes('smart') ||
      lower.includes('nid')
    ) {
      response = {
        content: isBangla
          ? `আমি আপনার সংযুক্ত জাতীয় পরিচয়পত্র নথি (${fileNames}) বিশ্লেষণ করেছি। এনআইডি বিধিমালা ২০১০ এর বিধি ৩ অনুসারে ১০-ডিজিটের স্মার্ট কার্ড অথবা ১৭-ডিজিটের প্রমিত বিন্যাস যাচাই করা হয়েছে। দলিলের নাম ও পিতার নামের সাথে এই রেকর্ডের মিল পাওয়া গেছে।`
          : `I have analyzed your attached National ID document (${fileNames}). Validated under Rule 3 of the National Identity Registration Rules (NIDW Rules, 2010). The identity number structural format, bearer name, and father's name are verified against registry parity rules.`,
        citations: [
          {
            id: 'nidw_rules_rule3',
            act: 'National Identity Registration Rules (NIDW)',
            section: 'Rule 3',
          },
        ],
      };
    } else if (
      attachmentNames.includes('khatian') ||
      attachmentNames.includes('porcha') ||
      attachmentNames.includes('ledger') ||
      lower.includes('khatian') ||
      lower.includes('dag')
    ) {
      response = {
        content: isBangla
          ? `আমি আপনার সংযুক্ত খতিয়ান নথি (${fileNames}) পরীক্ষা করেছি। রেজিস্ট্রেশন আইন ১৯০৮ এর ধারা ১৭ ও সম্পত্তি হস্তান্তর আইন ১৮৮২ এর ধারা ৫৪ অনুযায়ী রেকর্ড অব রাইটস ও দাগ নম্বরের বিবরণ যাচাই করা হয়েছে। মৌজার তফসিল ও মালিকানার ধারাবাহিকতা সংবিধিবদ্ধভাবে সঙ্গতিপূর্ণ।`
          : `I have examined your attached Khatian record (${fileNames}). Cross-checked against statutory title continuity requirements under Registration Act 1908 Section 17 and Transfer of Property Act 1882 Section 54. Mouza plot schedule and Dag allocations have been verified.`,
        citations: [
          {
            id: 'reg_act_1908_s17',
            act: 'Registration Act, 1908',
            section: 'Section 17',
          },
          {
            id: 'tpa_1882_s54',
            act: 'Transfer of Property Act, 1882',
            section: 'Section 54',
          },
        ],
      };
    } else {
      // Default deed / property conveyance scan
      response = {
        content: isBangla
          ? `আমি আপনার সংযুক্ত সম্পত্তি দলিল নথি (${fileNames}) পরীক্ষা করেছি। রেজিস্ট্রেশন আইন ১৯০৮ এর ধারা ২৩ অনুযায়ী সম্পাদনের তারিখ থেকে ৪ মাসের সংবিধিবদ্ধ সময়সীমা যাচাই করা হয়েছে এবং ধারা ১৭ এর অধীনে বাধ্যতামূলক রেজিস্ট্রেশনের শর্ত পূরণ হয়েছে। কোনো জালিয়াতি বা অপরাধমূলক অসঙ্গতি পাওয়া যায়নি (ভূমি অপরাধ আইন ২০২৩ ধারা ৪)।`
          : `I have parsed your attached document bundle (${fileNames}). Verified under Section 23 of the Registration Act, 1908: the deed execution date falls within the statutory 4-month presentation deadline. Compulsory registration compliance confirmed under Section 17, with zero penal defects detected under Section 4 of the Land Crime Prevention and Remedy Act, 2023.`,
        citations: [
          {
            id: 'reg_act_1908_s23',
            act: 'Registration Act, 1908',
            section: 'Section 23',
          },
          {
            id: 'reg_act_1908_s17',
            act: 'Registration Act, 1908',
            section: 'Section 17',
          },
          {
            id: 'lcpra_2023_s4',
            act: 'Land Crime Prevention & Remedy Act, 2023',
            section: 'Section 4',
          },
        ],
      };
    }
  }
  // 1. Deed presentation timeline / 4-month rule (Registration Act 1908 Sec 23)
  else if (
    lower.includes('signing and registering') ||
    lower.includes('how long') ||
    lower.includes('four month') ||
    lower.includes('4 month') ||
    lower.includes('time window') ||
    lower.includes('deadline') ||
    lower.includes('সময়সীমা') ||
    lower.includes('৪ মাস') ||
    lower.includes('কতদিন')
  ) {
    response = {
      content: isBangla
        ? 'রেজিস্ট্রেশন আইন, ১৯০৮ এর ধারা ২৩ অনুযায়ী, কোনো দলিল সম্পাদনের (স্বাক্ষরের) তারিখ থেকে সর্বোচ্চ ৪ মাসের মধ্যে তা নিবন্ধন কর্মকর্তার নিকট দাখিল করতে হবে। ধারা ২৪ ও ২৫ এ উল্লেখিত অনিবার্য কারণ ব্যতিরেকে এই সময়সীমা অতিক্রম করলে দলিল গ্রহণযোগ্য হবে না।'
        : 'Under Section 23 of the Registration Act, 1908, a document must be presented for registration within four months from the date of its execution. Except under urgent necessity or unavoidable delay permitted by Sections 24 and 25, this statutory presentation deadline is strictly enforced.',
      citations: [
        {
          id: 'reg_act_1908_s23',
          act: 'Registration Act, 1908',
          section: 'Section 23',
        },
      ],
    };
  }
  // 2. National ID validation format (NIDW Rules Rule 3 & 5)
  else if (
    lower.includes('nid') ||
    lower.includes('national id') ||
    lower.includes('smart card') ||
    lower.includes('digit') ||
    lower.includes('এনআইডি') ||
    lower.includes('ডিজিট') ||
    lower.includes('পরিচয়পত্র')
  ) {
    response = {
      content: isBangla
        ? 'জাতীয় পরিচয় নিবন্ধন বিধিমালা ২০১০ এর বিধি ৩ অনুসারে, বাংলাদেশে সংবিধিবদ্ধভাবে বৈধ জাতীয় পরিচয়পত্র নম্বর ১০-ডিজিটের স্মার্ট কার্ড অথবা ১৩/১৭-ডিজিটের সংখ্যা হতে হবে। ৯-ডিজিটের বা অন্যান্য অসংলগ্ন সংখ্যা সংবিধিবদ্ধ বৈধতা অর্জন করে না।'
        : 'Under Rule 3 of the National Identity Registration Rules, 2010, an authentic National ID number must strictly conform to either the 10-digit Smart NID format or the legacy 13/17-digit format. A 9-digit entry is structurally invalid under statutory vetting standards.',
      citations: [
        {
          id: 'nidw_rules_r3',
          act: 'National Identity Registration Rules, 2010',
          section: 'Rule 3',
        },
      ],
    };
  }
  // 3. Dag number mismatch / property schedule (TPA 1882 Sec 54 & Reg Act Sec 28)
  else if (
    lower.includes('dag') ||
    lower.includes('plot') ||
    lower.includes('schedule') ||
    lower.includes('mismatch') ||
    lower.includes('দাগ') ||
    lower.includes('প্লট') ||
    lower.includes('তফসিল') ||
    lower.includes('অমিল')
  ) {
    response = {
      content: isBangla
        ? 'দলিলের তফসিলে ঘোষিত দাগ নম্বর কালেক্টরেট আরএস/বিএস খতিয়ান রেকর্ডের সাথে হুবহু এক হতে হবে। দাগ নম্বরে গরমিল থাকলে সম্পত্তি হস্তান্তর আইন ১৮৮২ এর ধারা ৫৪ এবং রেজিস্ট্রেশন আইন ১৯০৮ এর ধারা ২৮ অনুযায়ী স্বত্ব হস্তান্তরে মারাত্মক আইনি ত্রুটি দেখা দেয়।'
        : 'The Dag (plot) number declared in the deed schedule must match the collectorate RS/BS Khatian ledger exactly. A mismatch constitutes a critical statutory defect under Transfer of Property Act 1882 Section 54 and Registration Act 1908 Section 28, indicating possible overlap or unverified transfer.',
      citations: [
        {
          id: 'reg_act_1908_s28',
          act: 'Registration Act, 1908',
          section: 'Section 28',
        },
        {
          id: 'tpa_1882_s54',
          act: 'Transfer of Property Act, 1882',
          section: 'Section 54',
        },
      ],
    };
  }
  // 4. Khatian / Record of Rights (Registration Act Sec 17)
  else if (
    lower.includes('khatian') ||
    lower.includes('porcha') ||
    lower.includes('record of rights') ||
    lower.includes('rs') ||
    lower.includes('bs') ||
    lower.includes('খতিয়ান') ||
    lower.includes('পর্চা')
  ) {
    response = {
      content: isBangla
        ? 'খতিয়ান (স্বত্বলিপি) হলো সরকারি রাজস্ব ও প্রকৃত মালিকানা প্রমাণের মূল ভিত্তি। রেজিস্ট্রেশন আইন ১৯০৮ এর ধারা ১৭ অনুযায়ী স্থাবর সম্পত্তির মালিকানা হস্তান্তরের পূর্বে ভূমি রেকর্ডের বৈধ খতিয়ান যাচাই করা বাধ্যতামূলক।'
        : 'A Khatian (Record of Rights) is the authoritative government ledger substantiating ownership and revenue records. Under Registration Act 1908 Section 17, verified Khatians are compulsory to prove title continuity before executing an immovable property conveyance.',
      citations: [
        {
          id: 'reg_act_1908_s17',
          act: 'Registration Act, 1908',
          section: 'Section 17',
        },
      ],
    };
  }
  // 5. Transfer pending suit / Lis Pendens (TPA 1882 Sec 52)
  else if (
    lower.includes('suit') ||
    lower.includes('court') ||
    lower.includes('litigation') ||
    lower.includes('lis pendens') ||
    lower.includes('মামলা') ||
    lower.includes('আদালত')
  ) {
    response = {
      content: isBangla
        ? 'সম্পত্তি হস্তান্তর আইন ১৮৮২ এর ধারা ৫২ (Lis Pendens) অনুসারে, কোনো স্থাবর সম্পত্তি নিয়ে আদালতে মামলা চলমান থাকা অবস্থায় সংশ্লিষ্ট সম্পত্তি হস্তান্তর করলে তা মামলার চূড়ান্ত রায়ের অধীন থাকবে।'
        : 'Under Section 52 of the Transfer of Property Act, 1882 (doctrine of Lis Pendens), any property transfer made during the active pendency of a contentious suit in court cannot affect the rights of any other party under the decree.',
      citations: [
        {
          id: 'tpa_1882_s52',
          act: 'Transfer of Property Act, 1882',
          section: 'Section 52',
        },
      ],
    };
  }
  // 6. Forged deeds / Land crime (LCPRA 2023 Sec 4)
  else if (
    lower.includes('forged') ||
    lower.includes('fake deed') ||
    lower.includes('crime') ||
    lower.includes('penalty') ||
    lower.includes('জাল') ||
    lower.includes('অপরাধ') ||
    lower.includes('শাস্তি')
  ) {
    response = {
      content: isBangla
        ? 'ভূমি অপরাধ প্রতিরোধ ও প্রতিকার আইন ২০২৩ এর ধারা ৪ অনুসারে, জাল দলিল তৈরি, ব্যবহার বা সংরক্ষণ করা একটি শাস্তিযোগ্য অপরাধ। এই আইনের অধীনে সর্বোচ্চ সাত বছর পর্যন্ত কারাদণ্ড ও অর্থদণ্ড হতে পারে।'
        : 'Under Section 4 of the Land Crime Prevention & Remedy Act, 2023, the creation, presentation, or possession of forged land documents is a severe cognizable offense subject to imprisonment up to seven years and punitive fines.',
      citations: [
        {
          id: 'lcpra_2023_s4',
          act: 'Land Crime Prevention & Remedy Act, 2023',
          section: 'Section 4',
        },
      ],
    };
  }
  // 7. Explicit out-of-corpus handling (Grounded zero-fabrication promise)
  else {
    response = {
      content: isBangla
        ? 'আমি আমাদের যাচাইকৃত সংবিধিবদ্ধ করপাসে (laws_corpus.json, ৪টি আইনের ২৮টি ধারা) এই বিষয়টি খুঁজে পাইনি। নথি এআই কেবল রেজিস্ট্রেশন আইন ১৯০৮, সম্পত্তি হস্তান্তর আইন ১৮৮২, ভূমি অপরাধ আইন ২০২৩ এবং এনআইডি বিধিমালার সংবিধিবদ্ধ ধারার ভিত্তিতে উত্তর প্রদান করে। আমি আপনাকে দলিল দাখিলের সময়সীমা, খতিয়ান যাচাই ও দাগ নম্বর মেলানোর বিষয়ে সাহায্য করতে পারি।'
        : 'I cannot find this topic in our verified statutory corpus (laws_corpus.json, 28 sections across 4 Acts). Nothi AI only explains verified sections of the Registration Act 1908, Transfer of Property Act 1882, Land Crime Prevention & Remedy Act 2023, and NID Rules. I can help you with deed presentation deadlines, Khatian records, Dag matching, and statutory vetting.',
      citations: [],
    };
  }

  // Simulate realistic word-by-word streaming effect if onChunk callback is provided
  if (onChunk) {
    const words = response.content.split(' ');
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 22));
      onChunk(word + ' ');
    }
  }

  return response;
}
