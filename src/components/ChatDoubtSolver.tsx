import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, Check, Copy, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { AnswerStyle, ChatMessage, MarksFilter, QuizCount, QuizDifficulty, SubjectItem } from '../types';

interface ChatDoubtSolverProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, style: AnswerStyle, marks: MarksFilter) => void;
  onRetryMessage: (assistantId: string) => void;
  answerStyle: AnswerStyle;
  onChangeAnswerStyle: (style: AnswerStyle) => void;
  marksFilter: MarksFilter;
  onChangeMarksFilter: (marks: MarksFilter) => void;
  activeSubjectContext: SubjectItem | null;
  onClearSubjectContext: () => void;
  isStreaming: boolean;
  onStartQuickQuiz: (subjectName: string, count: QuizCount, difficulty: QuizDifficulty) => void;
}

const QUICK_PROMPTS: {
  id: string;
  title: string;
  prompt: string;
  actionType: 'chat' | 'quiz';
  hasItalicWheat?: boolean;
}[] = [
  {
    id: 'p1',
    title: 'Explain Law of Minimum with agricultural significance (5 Marks)',
    prompt: 'Explain Law of Minimum with agricultural significance (5 Marks)',
    actionType: 'chat',
  },
  {
    id: 'p2',
    title: 'Difference between C3, C4, and CAM plants in table format',
    prompt: 'Difference between C3, C4, and CAM plants in table format',
    actionType: 'chat',
  },
  {
    id: 'p3',
    title: 'Start a 5-question ICAR JRF mock test on Soil Science',
    prompt: 'Start a 5-question ICAR JRF mock test on Soil Science',
    actionType: 'quiz',
  },
  {
    id: 'p4',
    title: 'Important weeds of Wheat (Triticum aestivum) and their control',
    prompt: 'Important weeds of Wheat (*Triticum aestivum*) and their control',
    actionType: 'chat',
    hasItalicWheat: true,
  },
];

export function ChatDoubtSolver({
  messages,
  onSendMessage,
  onRetryMessage,
  answerStyle,
  onChangeAnswerStyle,
  marksFilter,
  onChangeMarksFilter,
  activeSubjectContext,
  onClearSubjectContext,
  isStreaming,
  onStartQuickQuiz,
}: ChatDoubtSolverProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    onSendMessage(trimmed, answerStyle, marksFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-4rem)] bg-white">
      {/* Scrollable Chat Thread / Welcome Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-48">
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="pt-8 sm:pt-14 pb-6 text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#172119] tracking-tight text-balance">
                B.Sc. Agriculture AI Tutor — ICAR Syllabus Verified
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#4B5B4E] max-w-xl mx-auto leading-relaxed">
                Ask any doubt, generate exam notes, or practice ICAR-level tests.
              </p>

              {/* 4 Quick-Start Prompt Chips */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {QUICK_PROMPTS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      if (chip.actionType === 'quiz') {
                        onStartQuickQuiz('Fundamentals of Soil Science', 5, 'ICAR JRF / IBPS AFO');
                      } else {
                        onSendMessage(
                          chip.prompt,
                          answerStyle,
                          chip.id === 'p1' ? '5 Marks' : marksFilter
                        );
                      }
                    }}
                    className="group p-4 rounded-xl border border-[#DCE4DC] bg-[#FAFBF9] hover:bg-[#F1F6F1] hover:border-[#14532D] transition-colors text-left"
                  >
                    <div className="text-xs font-medium text-[#14532D] mb-1">
                      {chip.actionType === 'quiz' ? 'Timed Mock Quiz' : 'Exam Doubt Prompt'}
                    </div>
                    <div className="text-sm font-medium text-[#172119] leading-snug">
                      {chip.hasItalicWheat ? (
                        <>
                          Important weeds of Wheat (<span className="italic">Triticum aestivum</span>) and their control
                        </>
                      ) : (
                        chip.title
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl bg-[#F1F6F1] border border-[#DCE4DC] px-4 py-3 text-[#172119]">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        {(msg.marksFilter || msg.answerStyle) && (
                          <div className="mt-1.5 text-[11px] text-[#5A6A5D]">
                            {msg.marksFilter && msg.marksFilter !== 'Auto' ? `${msg.marksFilter} · ` : ''}
                            {msg.answerStyle === 'hinglish' ? 'Easy Hinglish' : 'Exam-Ready English'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex flex-col items-start">
                    <div className="w-full rounded-2xl border border-[#E3EAE3] bg-white px-5 py-4 sm:px-6 sm:py-5">
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#F0F4F0]">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AgriGPT India</span>
                          {msg.isStreaming && (
                            <span className="inline-flex items-center gap-1.5 text-[#5A6A5D] font-normal ml-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>{msg.statusText || 'Writing...'}</span>
                            </span>
                          )}
                        </div>

                        {!msg.isStreaming && !msg.error && msg.content && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#4B5B4E] hover:text-[#14532D] hover:bg-[#F1F6F1] rounded-md transition-colors"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#14532D]" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {msg.error ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[#713F12] bg-[#FEF8ED] border border-[#EAD4A4] rounded-lg p-3.5">
                          <span>{msg.content}</span>
                          <button
                            type="button"
                            onClick={() => onRetryMessage(msg.id)}
                            disabled={isStreaming}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] disabled:opacity-50 shrink-0 whitespace-nowrap"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry</span>
                          </button>
                        </div>
                      ) : (
                        <div className="prose-agri text-sm sm:text-[15px] leading-relaxed text-[#1E2920] space-y-3">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h2 className="text-lg font-bold text-[#14532D] mt-4 mb-2 font-sans">
                                  {children}
                                </h2>
                              ),
                              h2: ({ children }) => (
                                <h3 className="text-base font-bold text-[#14532D] mt-4 mb-1.5 font-sans">
                                  {children}
                                </h3>
                              ),
                              h3: ({ children }) => (
                                <h4 className="text-sm font-bold text-[#172119] mt-3 mb-1 font-sans">
                                  {children}
                                </h4>
                              ),
                              p: ({ children }) => (
                                <p className="leading-relaxed text-[#1E2920] my-2">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-5 space-y-1.5 my-2 text-[#1E2920]">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-5 space-y-1.5 my-2 text-[#1E2920]">
                                  {children}
                                </ol>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-[#111A13]">{children}</strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-[#14532D] font-medium">{children}</em>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-4 border border-[#DCE4DC] rounded-lg">
                                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-[#EFF4EE] border-b border-[#DCE4DC]">
                                  {children}
                                </thead>
                              ),
                              th: ({ children }) => (
                                <th className="px-3.5 py-2.5 font-semibold text-[#172119]">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-3.5 py-2.5 border-t border-[#EDF2ED] text-[#2D3A30]">
                                  {children}
                                </td>
                              ),
                              code: ({ children }) => (
                                <code className="font-mono text-xs bg-[#F4F6F3] border border-[#E2E8E2] px-1.5 py-0.5 rounded text-[#14532D]">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {msg.content || (msg.isStreaming ? 'Thinking...' : '')}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Fixed Chat Input Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-gradient-to-t from-white via-white to-white/85 pt-3 pb-4 px-4 sm:px-6 border-t border-[#EDF2ED]">
        <div className="max-w-3xl mx-auto">
          {activeSubjectContext && (
            <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#F1F6F1] border border-[#D4E2D4] text-xs text-[#14532D]">
              <span className="truncate">
                Syllabus Context: <strong className="font-semibold">{activeSubjectContext.code} — {activeSubjectContext.name}</strong>
              </span>
              <button
                type="button"
                onClick={onClearSubjectContext}
                aria-label="Clear syllabus context"
                className="ml-2 text-[#4B5B4E] hover:text-[#172119]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-[#CFDAD0] bg-[#FAFBF9] shadow-sm focus-within:border-[#14532D] focus-within:bg-white transition-colors">
            {/* Controls Row: Answer Style Toggle + Marks Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 pt-2.5 pb-1.5 border-b border-[#E8EEE7]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#5A6A5D] hidden sm:inline">
                  Answer Style:
                </span>
                <div
                  role="group"
                  aria-label="Answer Style"
                  className="inline-flex items-center p-0.5 bg-[#EDF2EC] rounded-lg border border-[#DCE4DC]"
                >
                  <button
                    type="button"
                    onClick={() => onChangeAnswerStyle('english')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                      answerStyle === 'english'
                        ? 'bg-white text-[#14532D] shadow-2xs'
                        : 'text-[#4B5B4E] hover:text-[#172119]'
                    }`}
                  >
                    Exam-Ready English
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeAnswerStyle('hinglish')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                      answerStyle === 'hinglish'
                        ? 'bg-white text-[#14532D] shadow-2xs'
                        : 'text-[#4B5B4E] hover:text-[#172119]'
                    }`}
                  >
                    Easy Hinglish
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="marks-filter-select" className="text-[11px] font-medium text-[#5A6A5D]">
                  Marks Filter:
                </label>
                <select
                  id="marks-filter-select"
                  value={marksFilter}
                  onChange={(e) => onChangeMarksFilter(e.target.value as MarksFilter)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D]"
                >
                  <option value="Auto">Auto</option>
                  <option value="2 Marks">2 Marks</option>
                  <option value="5 Marks">5 Marks</option>
                  <option value="10 Marks">10 Marks</option>
                  <option value="MCQ">MCQ</option>
                </select>
              </div>
            </div>

            {/* Textarea + Send Button */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2.5 pl-3.5">
              <textarea
                ref={textareaRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any B.Sc. Agriculture question..."
                aria-label="Ask any B.Sc. Agriculture question"
                className="flex-1 resize-none bg-transparent text-sm sm:text-[15px] text-[#172119] placeholder:text-[#6B7B6E] focus:outline-none max-h-36 py-1"
              />
              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-[#14532D] text-white flex items-center justify-center hover:bg-[#166534] disabled:opacity-45 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
