import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { ICAR_SUBJECTS } from '../data/icarSyllabus';
import { AttemptRecord, SubjectiveEvaluation, SubjectiveQuestion } from '../types';

interface MarkEvaluatorTabProps {
  onRecordAttempt: (attempt: AttemptRecord) => void;
}

export function MarkEvaluatorTab({ onRecordAttempt }: MarkEvaluatorTabProps) {
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(ICAR_SUBJECTS[0].name);
  const [topic, setTopic] = useState<string>(ICAR_SUBJECTS[0].topics[0]);
  const [marks, setMarks] = useState<5 | 10>(10);

  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionData, setQuestionData] = useState<SubjectiveQuestion | null>(null);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<SubjectiveEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const selectedSubjectObj = useMemo(
    () => ICAR_SUBJECTS.find((s) => s.name === selectedSubjectName) || ICAR_SUBJECTS[0],
    [selectedSubjectName]
  );

  useEffect(() => {
    if (!questionData || evaluation) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [questionData, evaluation]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleGetQuestion = async () => {
    if (!topic.trim()) return;
    setQuestionLoading(true);
    setError(null);
    setEvaluation(null);
    setStudentAnswer('');
    setSeconds(0);

    try {
      const res = await fetch('/api/test/subjective-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: selectedSubjectName,
          topic: topic.trim(),
          marks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate university question.');
      setQuestionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate question.');
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!questionData || studentAnswer.trim().length < 15) {
      setError('Please write at least 15 characters before submitting for professor grading.');
      return;
    }
    setEvalLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/test/subjective-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: selectedSubjectName,
          topic: topic.trim(),
          question: questionData.question,
          marks: questionData.marks,
          studentAnswer: studentAnswer.trim(),
        }),
      });
      const data: SubjectiveEvaluation & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to grade answer.');
      setEvaluation(data);

      onRecordAttempt({
        id: `subj-${Date.now()}`,
        type: 'subjective',
        subjectName: selectedSubjectName,
        topic: topic.trim(),
        score: Number(data.scoreOutOf10.toFixed(1)),
        maxScore: 10,
        accuracyPercent: Math.round((data.scoreOutOf10 / 10) * 100),
        timeSpentSeconds: Math.max(1, seconds),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to evaluate answer.');
    } finally {
      setEvalLoading(false);
    }
  };

  const wordCount = studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <section className="bg-white border border-[#DCE4DC] rounded-xl p-5 sm:p-6">
        <div className="pb-4 border-b border-[#E8EEE7]">
          <div className="text-xs font-medium text-[#14532D]">SAU Theory Answer Grading</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172119] mt-1">
            5 &amp; 10 Mark Answer Evaluator
          </h1>
          <p className="text-xs sm:text-sm text-[#5A6A5D] mt-1">
            Get a real ICAR university question, write your answer, and receive strict professor-grade scoring out of 10 with missing keywords.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label htmlFor="eval-subject" className="block text-xs font-semibold text-[#3F4E42] mb-1.5">
              ICAR Subject
            </label>
            <select
              id="eval-subject"
              value={selectedSubjectName}
              onChange={(e) => {
                const name = e.target.value;
                setSelectedSubjectName(name);
                const found = ICAR_SUBJECTS.find((s) => s.name === name);
                if (found?.topics[0]) setTopic(found.topics[0]);
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

          <div className="md:col-span-4">
            <label htmlFor="eval-topic" className="block text-xs font-semibold text-[#3F4E42] mb-1.5">
              Topic
            </label>
            <input
              id="eval-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              list="eval-topics-datalist"
              placeholder="Enter any syllabus topic..."
              className="w-full px-3 py-2 text-sm bg-[#FAFBF9] border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D] focus:bg-white"
            />
            <datalist id="eval-topics-datalist">
              {selectedSubjectObj.topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="eval-marks" className="block text-xs font-semibold text-[#3F4E42] mb-1.5">
              Marks
            </label>
            <select
              id="eval-marks"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value) === 5 ? 5 : 10)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D]"
            >
              <option value={5}>5 Marks</option>
              <option value={10}>10 Marks</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleGetQuestion}
              disabled={questionLoading || !topic.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] disabled:opacity-55 transition-colors whitespace-nowrap"
            >
              {questionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{questionData ? 'New Q' : 'Get Q'}</span>
            </button>
          </div>
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
            onClick={() => (questionData ? handleEvaluate() : handleGetQuestion())}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {questionLoading && (
        <div className="bg-white border border-[#DCE4DC] rounded-xl p-8 text-center space-y-2">
          <Loader2 className="w-7 h-7 animate-spin text-[#14532D] mx-auto" />
          <div className="text-sm font-semibold text-[#172119]">
            Generating a {marks}-mark university exam question...
          </div>
        </div>
      )}

      {!questionData && !questionLoading && (
        <div className="bg-white border border-[#DCE4DC] rounded-xl p-8 text-center">
          <p className="text-sm text-[#4B5B4E]">
            Click <span className="font-semibold text-[#14532D]">Get Q</span> above to generate a {marks}-mark exam question for <span className="font-semibold text-[#172119]">{selectedSubjectName}</span>.
          </p>
        </div>
      )}

      {questionData && !questionLoading && (
        <div className="bg-white border border-[#DCE4DC] rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E8EEE7]">
            <div className="text-xs font-mono font-semibold text-[#854D0E] tabular-nums">
              {questionData.marks}-Mark Question · Target ~{questionData.expectedWordCount} words
            </div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs text-[#5A6A5D] tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(seconds)}</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#172119] leading-snug">
              {questionData.question}
            </h2>
            <p className="mt-2 text-xs text-[#5A6A5D]">
              <span className="font-semibold text-[#3F4E42]">Expected Structure: </span>
              {questionData.contextHint}
            </p>
          </div>

          <div>
            <textarea
              rows={9}
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              disabled={evalLoading}
              placeholder="Write your university exam answer here using headings, scientific binomials, exact NPK/seed rate metrics, and Indian crop varieties..."
              aria-label="Your subjective exam answer"
              className="w-full p-4 text-sm bg-[#FAFBF9] border border-[#CFDAD0] rounded-lg text-[#172119] placeholder:text-[#738476] leading-relaxed focus:outline-none focus:border-[#14532D] focus:bg-white"
            />
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono text-[#5A6A5D] tabular-nums">
                {wordCount} words
              </span>
              <button
                type="button"
                onClick={handleEvaluate}
                disabled={evalLoading || studentAnswer.trim().length < 15}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] disabled:opacity-55 transition-colors"
              >
                {evalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Professor Grading...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Evaluate Answer (Out of 10)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {evaluation && (
        <section className="bg-white border border-[#DCE4DC] rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8EEE7]">
            <div className="flex items-center gap-3">
              <FileCheck2 className="w-6 h-6 text-[#14532D]" />
              <div>
                <div className="text-xs text-[#5A6A5D]">Professor Grading Report</div>
                <h3 className="text-xl font-bold text-[#172119]">
                  Score: <span className="font-mono text-[#14532D] tabular-nums">{evaluation.scoreOutOf10.toFixed(1)} / 10</span>
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="px-3 py-2 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2]">
                <div className="text-[11px] text-[#5A6A5D]">Clarity</div>
                <div className="font-mono text-sm font-semibold text-[#172119] tabular-nums">
                  {evaluation.rubricBreakdown.conceptualClarity}/4
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2]">
                <div className="text-[11px] text-[#5A6A5D]">Terminology</div>
                <div className="font-mono text-sm font-semibold text-[#172119] tabular-nums">
                  {evaluation.rubricBreakdown.scientificTerminology}/3
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#FAFBF9] border border-[#E2E8E2]">
                <div className="text-[11px] text-[#5A6A5D]">Structure</div>
                <div className="font-mono text-sm font-semibold text-[#172119] tabular-nums">
                  {evaluation.rubricBreakdown.structureAndCompleteness}/3
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#14532D] mb-1.5">Examiner Feedback</h4>
            <p className="text-sm text-[#243026] leading-relaxed">{evaluation.examinerFeedback}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-lg bg-[#F1F7F1] border border-[#CBE0CC]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#14532D] mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Matched Technical Keywords</span>
              </div>
              <ul className="space-y-1 text-xs text-[#1F3523] list-disc pl-4">
                {evaluation.matchedKeywords.map((kw, i) => (
                  <li key={i}>{kw}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-[#FEF8ED] border border-[#EAD4A4]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#854D0E] mb-2">
                <AlertCircle className="w-4 h-4" />
                <span>Missing ICAR Keywords</span>
              </div>
              <ul className="space-y-1 text-xs text-[#4A2E07] list-disc pl-4">
                {evaluation.missingKeywords.map((kw, i) => (
                  <li key={i}>{kw}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8EEE7]">
            <h4 className="text-xs font-semibold text-[#172119] mb-2">
              Model Answer Blueprint (9.5/10 Standard)
            </h4>
            <ul className="space-y-1.5 text-xs text-[#3F4E42] list-disc pl-5 leading-relaxed">
              {evaluation.modelAnswerOutline.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
