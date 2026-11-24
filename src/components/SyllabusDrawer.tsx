import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Search, X } from 'lucide-react';
import { ICAR_SEMESTERS, ICAR_SUBJECTS } from '../data/icarSyllabus';
import { SubjectItem } from '../types';

interface SyllabusDrawerProps {
  open: boolean;
  onClose: () => void;
  onLoadTopicInChat: (topic: string, subject: SubjectItem) => void;
}

export function SyllabusDrawer({
  open,
  onClose,
  onLoadTopicInChat,
}: SyllabusDrawerProps) {
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(ICAR_SUBJECTS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const semesterSubjects = useMemo(
    () => ICAR_SUBJECTS.filter((s) => s.semester === selectedSemester),
    [selectedSemester]
  );

  const activeSubject = useMemo(
    () =>
      semesterSubjects.find((s) => s.id === selectedSubjectId) ||
      semesterSubjects[0] ||
      ICAR_SUBJECTS[0],
    [semesterSubjects, selectedSubjectId]
  );

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { subject: SubjectItem; topic: string }[] = [];
    for (const subj of ICAR_SUBJECTS) {
      for (const topic of subj.topics) {
        if (
          topic.toLowerCase().includes(q) ||
          subj.name.toLowerCase().includes(q) ||
          subj.code.toLowerCase().includes(q)
        ) {
          results.push({ subject: subj, topic });
        }
      }
    }
    return results.slice(0, 15);
  }, [searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="ICAR 5th and 6th Dean's Syllabus">
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl border-l border-[#DCE4DC] flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#E8EEE7] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#14532D]" />
            <div>
              <h2 className="text-lg font-bold text-[#172119]">
                ICAR 5th &amp; 6th Dean&apos;s Syllabus
              </h2>
              <p className="text-xs text-[#5A6A5D]">
                Click any subject or syllabus topic to load it directly into AI Doubt Solver
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close syllabus drawer"
            className="p-2 rounded-lg text-[#4B5B4E] hover:bg-[#F1F5F0] hover:text-[#172119]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 py-3.5 border-b border-[#EDF2ED] bg-[#FAFBF9]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#647468] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects or topics across Semesters 1–8..."
              className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear syllabus search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#647468] hover:text-[#172119]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchQuery.trim() !== '' ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#5A6A5D] mb-2">
                Search Results ({searchMatches.length})
              </div>
              {searchMatches.length === 0 ? (
                <p className="text-sm text-[#5A6A5D] py-6">
                  No matching syllabus module found. Try asking directly in AI Doubt Solver!
                </p>
              ) : (
                searchMatches.map(({ subject, topic }) => (
                  <button
                    key={`${subject.id}-${topic}`}
                    type="button"
                    onClick={() => {
                      onLoadTopicInChat(topic, subject);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-3 text-left p-3.5 rounded-lg border border-[#E2E8E2] hover:border-[#14532D] hover:bg-[#F4F8F4] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#172119]">{topic}</div>
                      <div className="text-xs text-[#5A6A5D] mt-0.5">
                        Semester {subject.semester} · {subject.code} · {subject.name}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#14532D] shrink-0" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Semester 1–8 Selector */}
              <div>
                <div className="text-xs font-semibold text-[#3F4E42] mb-2.5">
                  Select Semester (1 to 8)
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {ICAR_SEMESTERS.map((sem) => {
                    const isSelected = selectedSemester === sem.semester;
                    return (
                      <button
                        key={sem.semester}
                        type="button"
                        onClick={() => {
                          setSelectedSemester(sem.semester);
                          const first = ICAR_SUBJECTS.find((s) => s.semester === sem.semester);
                          if (first) setSelectedSubjectId(first.id);
                        }}
                        className={`py-2 px-2 text-xs font-mono font-semibold rounded-lg border transition-colors tabular-nums ${
                          isSelected
                            ? 'bg-[#14532D] border-[#14532D] text-white'
                            : 'bg-[#FAFBF9] border-[#DCE4DC] text-[#2D3A30] hover:border-[#14532D]'
                        }`}
                      >
                        Sem {sem.semester}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-[#5A6A5D]">
                  {ICAR_SEMESTERS.find((s) => s.semester === selectedSemester)?.focus}
                </p>
              </div>

              {/* Subjects in Semester */}
              <div>
                <div className="text-xs font-semibold text-[#3F4E42] mb-2.5">
                  Core Subjects in Semester {selectedSemester}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {semesterSubjects.map((subj) => {
                    const isSelected = activeSubject.id === subj.id;
                    return (
                      <button
                        key={subj.id}
                        type="button"
                        onClick={() => setSelectedSubjectId(subj.id)}
                        className={`text-left p-3.5 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-[#EEF5EE] border-[#14532D]'
                            : 'bg-white border-[#DCE4DC] hover:border-[#84A389]'
                        }`}
                      >
                        <div className="text-[11px] font-mono text-[#14532D] font-semibold">
                          {subj.code} · {subj.credits} Cr
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-[#172119]">
                          {subj.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topics of Selected Subject */}
              <div className="pt-2 border-t border-[#E8EEE7]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#172119]">
                      {activeSubject.name} — Syllabus Topics
                    </h3>
                    <p className="text-xs text-[#5A6A5D]">
                      Click any topic to load directly into the AI Doubt Solver
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadTopicInChat(
                        `Give a high-yield ICAR exam overview and important 5-mark questions for ${activeSubject.name}`,
                        activeSubject
                      );
                      onClose();
                    }}
                    className="text-xs font-semibold text-[#14532D] hover:underline whitespace-nowrap"
                  >
                    Load Entire Subject Overview
                  </button>
                </div>

                <div className="space-y-2">
                  {activeSubject.topics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        onLoadTopicInChat(
                          `Explain "${topic}" from ${activeSubject.name} with ICAR exam-ready structure`,
                          activeSubject
                        );
                        onClose();
                      }}
                      className="w-full flex items-center justify-between gap-3 text-left px-4 py-3 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2] hover:border-[#14532D] hover:bg-[#F2F7F2] transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-medium text-[#172119]">
                        {topic}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14532D] shrink-0">
                        <span>Ask AI</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
