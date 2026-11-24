import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  Play,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { ICAR_SUBJECTS } from '../data/icarSyllabus';
import { AttemptRecord, McqQuestion, QuizCount, QuizDifficulty } from '../types';

export interface QuizPreset {
  subjectName: string;
  count: QuizCount;
  difficulty: QuizDifficulty;
  nonce: number;
}

interface MockQuizTabProps {
  preset?: QuizPreset | null;
  onRecordAttempt: (attempt: AttemptRecord) => void;
}

export function MockQuizTab({ preset, onRecordAttempt }: MockQuizTabProps) {
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(ICAR_SUBJECTS[0].name);
  const [topic, setTopic] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<QuizCount>(10);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('ICAR JRF / IBPS AFO');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [totalDuration, setTotalDuration] = useState(600);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const selectedSubjectObj = useMemo(
    () => ICAR_SUBJECTS.find((s) => s.name === selectedSubjectName) || ICAR_SUBJECTS[0],
    [selectedSubjectName]
  );

  const launchQuiz = async (
    subjName: string,
    focusTopic: string,
    count: QuizCount,
    diff: QuizDifficulty
  ) => {
    setLoading(true);
    setError(null);
    setSubmitted(false);
    setAnswers({});
    setFlagged({});
    setCurrentIdx(0);
    const duration = count * 60;
    setTotalDuration(duration);
    setSecondsLeft(duration);

    try {
      const res = await fetch('/api/test/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: subjName,
          topic: focusTopic.trim() || 'Core ICAR Syllabus Topics',
          questionCount: count,
          difficulty: diff,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate mock quiz.');
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions returned. Please try again.');
      }
      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start mock test.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-start when triggered from Quick-Start Prompt Chip #3
  useEffect(() => {
    if (!preset) return;
    setSelectedSubjectName(preset.subjectName);
    setQuestionCount(preset.count);
    setDifficulty(preset.difficulty);
    setTopic('');
    launchQuiz(preset.subjectName, '', preset.count, preset.difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset?.nonce]);

  // Timer
  useEffect(() => {
    if (questions.length === 0 || submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(totalDuration);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, submitted, totalDuration]);

  const handleSubmit = (forcedElapsed?: number) => {
    if (submitted || questions.length === 0) return;
    const timeUsed = forcedElapsed ?? Math.max(1, totalDuration - secondsLeft);
    setElapsed(timeUsed);
    setSubmitted(true);

    const correctCount = questions.reduce(
      (sum, q, idx) => (answers[idx] === q.correctIndex ? sum + 1 : sum),
      0
    );
    const accuracyPercent = Math.round((correctCount / questions.length) * 100);

    onRecordAttempt({
      id: `mcq-${Date.now()}`,
      type: 'mcq',
      subjectName: selectedSubjectName,
      topic: topic.trim() || `${difficulty} (${questions.length} Qs)`,
      score: correctCount,
      maxScore: questions.length,
      accuracyPercent,
      timeSpentSeconds: timeUsed,
      timestamp: new Date().toISOString(),
    });
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const correctCount = questions.reduce(
    (sum, q, idx) => (answers[idx] === q.correctIndex ? sum + 1 : sum),
    0
  );
  const attemptedCount = Object.keys(answers).length;
  const wrongCount = attemptedCount - correctCount;
  const jrfNet = correctCount * 4 - wrongCount;
  const accuracyPct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Test Generator Configuration Card */}
      <section className="bg-white border border-[#DCE4DC] rounded-xl p-5 sm:p-6">
        <div className="pb-4 border-b border-[#E8EEE7]">
          <div className="text-xs font-medium text-[#14532D]">Timed MCQ Assessment</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172119] mt-1">
            ICAR Mock Test &amp; Quiz Generator
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6A5D] mt-1">
            Select an ICAR subject, question count (5, 10, or 20), and difficulty level to start a timed test.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label htmlFor="quiz-subject" className="block text-xs font-semibold text-[#3F4E42] mb-1.5">
              ICAR Subject
            </label>
            <select
              id="quiz-subject"
              value={selectedSubjectName}
              onChange={(e) => {
                setSelectedSubjectName(e.target.value);
                setTopic('');
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D]"
            >
              {ICAR_SUBJECTS.map((subj) => (
                <option key={subj.id} value={subj.name}>
                  Sem {subj.semester} · {subj.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="quiz-topic" className="block text-xs font-semibold text-[#3F4E42] mb-1.5">
              Topic (Optional)
            </label>
            <input
              id="quiz-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              list="subject-topics-datalist"
              placeholder="All syllabus topics..."
              className="w-full px-3 py-2 text-sm bg-[#FAFBF9] border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D] focus:bg-white"
            />
            <datalist id="subject-topics-datalist">
              {selectedSubjectObj.topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="quiz-count" className="block text-xs font-semibold text-[#3F4E42] mb-1.5">
              Questions
            </label>
            <select
              id="quiz-count"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value) as QuizCount)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#CFDAD0] rounded-lg text-[#172119] font-mono tabular-nums focus:outline-none focus:border-[#14532D]"
            >
              <option value={5}>5 MCQs (5 min)</option>
              <option value={10}>10 MCQs (10 min)</option>
              <option value={20}>20 MCQs (20 min)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="quiz-difficulty" className="block text-xs font-semibold text-[#3F4E42] mb-1.5">
              Difficulty Pattern
            </label>
            <select
              id="quiz-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuizDifficulty)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D]"
            >
              <option value="University Semester">University Semester</option>
              <option value="ICAR JRF / IBPS AFO">ICAR JRF / IBPS AFO</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => launchQuiz(selectedSubjectName, topic, questionCount, difficulty)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] disabled:opacity-55 transition-colors whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating {questionCount} MCQs...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start {questionCount}-Question Test</span>
              </>
            )}
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FEF8ED] border border-[#EAD4A4] text-[#713F12] rounded-xl p-4 text-sm"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => launchQuiz(selectedSubjectName, topic, questionCount, difficulty)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white border border-[#DCE4DC] rounded-xl p-10 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#14532D] mx-auto" />
          <div className="text-sm font-semibold text-[#172119]">
            Generating {questionCount} {difficulty} MCQs on {selectedSubjectName}...
          </div>
          <div className="text-xs text-[#5A6A5D]">
            Automatic retry &amp; fallback protection active if server traffic is high.
          </div>
        </div>
      )}

      {/* Active Timed Quiz */}
      {!loading && questions.length > 0 && !submitted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-[#DCE4DC] rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8EEE7]">
              <div className="text-xs text-[#5A6A5D] tabular-nums">
                Question <span className="font-semibold text-[#172119]">{currentIdx + 1}</span> of{' '}
                {questions.length} · {questions[currentIdx].difficulty} · {questions[currentIdx].subtopic}
              </div>
              <div
                className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums ${
                  secondsLeft <= 60 ? 'text-[#B91C1C]' : 'text-[#14532D]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>
            </div>

            <h2 className="mt-5 text-base sm:text-lg font-semibold text-[#172119] leading-relaxed">
              {questions[currentIdx].question}
            </h2>

            <div className="mt-5 space-y-3">
              {questions[currentIdx].options.map((opt, oIdx) => {
                const isSelected = answers[currentIdx] === oIdx;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentIdx]: oIdx }))}
                    className={`w-full flex items-start gap-3.5 text-left p-4 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-[#EEF5EE] border-[#14532D] text-[#14532D]'
                        : 'bg-[#FAFBF9] border-[#DCE4DC] text-[#172119] hover:border-[#84A389]'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-semibold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#14532D] text-white'
                          : 'bg-white border border-[#CFDAD0] text-[#4B5B4E]'
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-[#E8EEE7] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setFlagged((prev) => ({ ...prev, [currentIdx]: !prev[currentIdx] }))}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  flagged[currentIdx]
                    ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                    : 'bg-white border-[#DCE4DC] text-[#4B5B4E] hover:border-[#14532D]'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged[currentIdx] ? 'Flagged' : 'Mark for Review'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE4DC] text-[#172119] disabled:opacity-40 hover:bg-[#F1F5F0]"
                >
                  Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534]"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#854D0E] text-white hover:bg-[#713F12]"
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 bg-white border border-[#DCE4DC] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#172119]">Question Palette</h3>
              <span className="text-xs font-mono text-[#5A6A5D] tabular-nums">
                {attemptedCount}/{questions.length} Answered
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = answers[idx] !== undefined;
                const isFlagged = !!flagged[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-lg font-mono text-xs font-semibold tabular-nums border transition-colors ${
                      isCurrent
                        ? 'border-[#14532D] bg-[#14532D] text-white'
                        : isFlagged
                        ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                        : isAnswered
                        ? 'bg-[#EAF3EA] border-[#9EC3A2] text-[#14532D]'
                        : 'bg-[#FAFBF9] border-[#DCE4DC] text-[#4B5B4E]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] transition-colors"
            >
              Submit &amp; Score Test
            </button>
          </aside>
        </div>
      )}

      {/* Results & Explanations */}
      {!loading && questions.length > 0 && submitted && (
        <div className="space-y-6">
          <section className="bg-white border border-[#DCE4DC] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8EEE7]">
              <div>
                <div className="text-xs font-semibold text-[#14532D]">{difficulty} · Results</div>
                <h2 className="text-2xl font-bold text-[#172119] mt-1">{selectedSubjectName}</h2>
              </div>
              <button
                type="button"
                onClick={() => launchQuiz(selectedSubjectName, topic, questionCount, difficulty)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate New Test</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2]">
                <div className="text-xs text-[#5A6A5D]">Correct Answers</div>
                <div className="mt-1 text-2xl font-bold font-mono text-[#172119] tabular-nums">
                  {correctCount} / {questions.length}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2]">
                <div className="text-xs text-[#5A6A5D]">Accuracy</div>
                <div className="mt-1 text-2xl font-bold font-mono text-[#14532D] tabular-nums">
                  {accuracyPct}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2]">
                <div className="text-xs text-[#5A6A5D]">JRF Net (+4/-1)</div>
                <div className="mt-1 text-2xl font-bold font-mono text-[#854D0E] tabular-nums">
                  {jrfNet} / {questions.length * 4}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2]">
                <div className="text-xs text-[#5A6A5D]">Time Taken</div>
                <div className="mt-1 text-2xl font-bold font-mono text-[#172119] tabular-nums">
                  {formatTimer(elapsed)}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-bold text-[#172119]">
              Detailed Answer Key &amp; Scientific Explanations
            </h3>
            {questions.map((q, idx) => {
              const chosen = answers[idx];
              const isCorrect = chosen === q.correctIndex;
              const isSkipped = chosen === undefined;

              return (
                <div key={q.id || idx} className="bg-white border border-[#DCE4DC] rounded-xl p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono text-[#5A6A5D] tabular-nums">
                      Q{idx + 1} · {q.difficulty} · {q.subtopic}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        isCorrect
                          ? 'text-[#14532D]'
                          : isSkipped
                          ? 'text-[#854D0E]'
                          : 'text-[#B91C1C]'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correct</span>
                        </>
                      ) : isSkipped ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Unattempted</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-[#172119]">{q.question}</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt, oIdx) => {
                      const isOptionCorrect = oIdx === q.correctIndex;
                      const isOptionChosen = oIdx === chosen;
                      return (
                        <div
                          key={oIdx}
                          className={`px-3 py-2.5 rounded-lg border flex items-start gap-2 ${
                            isOptionCorrect
                              ? 'bg-[#EEF6EE] border-[#14532D] text-[#14532D] font-medium'
                              : isOptionChosen
                              ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B]'
                              : 'bg-[#FAFBF9] border-[#E8EEE7] text-[#4B5B4E]'
                          }`}
                        >
                          <span className="font-mono font-semibold shrink-0">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#F7F9F6] border border-[#E5ECE4] text-xs text-[#2D3A30] leading-relaxed">
                    <span className="font-semibold text-[#14532D]">Explanation: </span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
