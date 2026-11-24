import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Microscope,
  RotateCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { PRACTICAL_CATEGORIES, SEED_PRACTICAL_CARDS } from '../data/practicalDecks';
import { AttemptRecord, PracticalCard, PracticalCategory, VivaEvaluation } from '../types';

interface PracticalVivaTabProps {
  onRecordAttempt: (attempt: AttemptRecord) => void;
}

type VivaMode = 'rapidfire' | 'flashcards';

export function PracticalVivaTab({ onRecordAttempt }: PracticalVivaTabProps) {
  const [category, setCategory] = useState<PracticalCategory>('weeds');
  const [mode, setMode] = useState<VivaMode>('rapidfire');
  const [cards, setCards] = useState<PracticalCard[]>(SEED_PRACTICAL_CARDS);
  const [cardIndex, setCardIndex] = useState(0);
  const [showVivaAnswer, setShowVivaAnswer] = useState(false);
  const [generatingDeck, setGeneratingDeck] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [labImgError, setLabImgError] = useState(false);

  const [vivaIdx, setVivaIdx] = useState(0);
  const [vivaInput, setVivaInput] = useState('');
  const [vivaEvaluating, setVivaEvaluating] = useState(false);
  const [vivaEvaluation, setVivaEvaluation] = useState<VivaEvaluation | null>(null);
  const [vivaError, setVivaError] = useState<string | null>(null);
  const [sessionScores, setSessionScores] = useState<number[]>([]);

  const categoryCards = useMemo(
    () => cards.filter((c) => c.category === category),
    [cards, category]
  );

  const activeCard = categoryCards[cardIndex] || categoryCards[0];
  const activeVivaCard = categoryCards[vivaIdx] || categoryCards[0];

  const handleCategoryChange = (newCat: PracticalCategory) => {
    setCategory(newCat);
    setCardIndex(0);
    setShowVivaAnswer(false);
    setVivaIdx(0);
    setVivaInput('');
    setVivaEvaluation(null);
    setSessionScores([]);
    setDeckError(null);
    setVivaError(null);
  };

  const handleGenerateFreshCards = async () => {
    setGeneratingDeck(true);
    setDeckError(null);

    try {
      const existingTitles = categoryCards.map((c) => c.title);
      const res = await fetch('/api/viva/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          existingTitles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate practical cards');
      const newCards: PracticalCard[] = (data.cards || []).map(
        (c: Omit<PracticalCard, 'id' | 'category'>, i: number) => ({
          ...c,
          id: `${category}-ai-${Date.now()}-${i}`,
          category,
        })
      );
      if (newCards.length > 0) {
        setCards((prev) => [...prev, ...newCards]);
        setCardIndex(categoryCards.length);
        setShowVivaAnswer(false);
      }
    } catch (err) {
      setDeckError(err instanceof Error ? err.message : 'Unable to generate practical cards.');
    } finally {
      setGeneratingDeck(false);
    }
  };

  const handleSubmitVivaAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVivaCard || !vivaInput.trim()) return;
    setVivaEvaluating(true);
    setVivaError(null);

    try {
      const res = await fetch('/api/viva/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeVivaCard.vivaQuestion,
          studentAnswer: vivaInput.trim(),
          referenceAnswer: activeVivaCard.vivaAnswer,
        }),
      });
      const data: VivaEvaluation & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to evaluate viva response');
      setVivaEvaluation(data);
      setSessionScores((prev) => [...prev, data.scoreOutOf5]);

      onRecordAttempt({
        id: `viva-${Date.now()}`,
        type: 'viva',
        subjectName:
          PRACTICAL_CATEGORIES.find((cat) => cat.id === category)?.label || 'Practical Viva',
        topic: activeVivaCard.title,
        score: data.scoreOutOf5,
        maxScore: 5,
        accuracyPercent: Math.round((data.scoreOutOf5 / 5) * 100),
        timeSpentSeconds: 30,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setVivaError(err instanceof Error ? err.message : 'Unable to evaluate viva answer.');
    } finally {
      setVivaEvaluating(false);
    }
  };

  const handleNextVivaQuestion = () => {
    setVivaIdx((prev) => (prev + 1) % categoryCards.length);
    setVivaInput('');
    setVivaEvaluation(null);
    setVivaError(null);
  };

  const activeCategoryMeta = PRACTICAL_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <section className="bg-white border border-[#DCE4DC] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E8EEE7]">
          <div>
            <div className="text-xs text-[#5A6A5D]">
              Spotting · Lab Manuals · External Examiner Viva Practice
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#172119] mt-1">
              Practical &amp; Viva Simulator
            </h1>
          </div>

          <div
            role="group"
            aria-label="Practical study mode"
            className="inline-flex items-center p-1 bg-[#F1F5F0] border border-[#DCE4DC] rounded-lg self-start md:self-auto shrink-0"
          >
            <button
              type="button"
              onClick={() => setMode('rapidfire')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'rapidfire'
                  ? 'bg-white text-[#14532D] shadow-xs border border-[#DCE4DC]'
                  : 'text-[#4B5B4E] hover:text-[#172119]'
              }`}
            >
              Rapid-Fire Viva Q&amp;A
            </button>
            <button
              type="button"
              onClick={() => setMode('flashcards')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                mode === 'flashcards'
                  ? 'bg-white text-[#14532D] shadow-xs border border-[#DCE4DC]'
                  : 'text-[#4B5B4E] hover:text-[#172119]'
              }`}
            >
              Identification Flashcards
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRACTICAL_CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#14532D] border-[#14532D] text-white'
                    : 'bg-[#FAFBF9] border-[#DCE4DC] text-[#3F4E42] hover:border-[#14532D]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
        {activeCategoryMeta && (
          <p className="mt-2.5 text-xs text-[#5A6A5D]">Focus: {activeCategoryMeta.subtitle}</p>
        )}
      </section>

      {deckError && (
        <div role="alert" className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-xl p-4 text-sm">
          {deckError}
        </div>
      )}

      {mode === 'rapidfire' && activeVivaCard && (
        <div className="bg-white border border-[#DCE4DC] rounded-xl p-6 sm:p-7 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8EEE7]">
            <div>
              <div className="text-xs font-mono text-[#5A6A5D] tabular-nums">
                Rapid-Fire Viva · Question {vivaIdx + 1} of {categoryCards.length} ·{' '}
                {activeCategoryMeta?.label}
              </div>
              <div className="text-xs text-[#5A6A5D] mt-0.5">
                Specimen / Item: {activeVivaCard.title} (<span className="italic">{activeVivaCard.scientificOrTechnicalSubtitle}</span>)
              </div>
            </div>

            {sessionScores.length > 0 && (
              <div className="text-xs font-mono font-semibold text-[#14532D] tabular-nums">
                Session Avg:{' '}
                {(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length).toFixed(1)} / 5
              </div>
            )}
          </div>

          <div className="p-5 rounded-xl bg-[#FAFBF9] border border-[#DCE4DC]">
            <div className="text-xs font-semibold text-[#854D0E]">External Examiner Asks:</div>
            <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-[#172119] leading-snug">
              &ldquo;{activeVivaCard.vivaQuestion}&rdquo;
            </h2>
          </div>

          <form onSubmit={handleSubmitVivaAnswer} className="space-y-3">
            <textarea
              rows={3}
              value={vivaInput}
              onChange={(e) => setVivaInput(e.target.value)}
              disabled={vivaEvaluating}
              placeholder="Type your crisp 1–3 sentence viva answer..."
              aria-label="Your viva response"
              className="w-full p-3.5 text-sm bg-white border border-[#CFDAD0] rounded-lg text-[#172119] focus:outline-none focus:border-[#14532D]"
            />

            {vivaError && <div className="text-xs text-[#B91C1C]">{vivaError}</div>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNextVivaQuestion}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#4B5B4E] bg-[#FAFBF9] border border-[#DCE4DC] rounded-lg hover:text-[#172119]"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Next Question</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateFreshCards}
                  disabled={generatingDeck}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#14532D] bg-[#EFF5EF] border border-[#C7D8C7] rounded-lg hover:bg-[#E2EDE2] disabled:opacity-55"
                >
                  {generatingDeck ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Add 5 New Questions</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={vivaEvaluating || !vivaInput.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] disabled:opacity-55 transition-colors"
              >
                {vivaEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Viva Answer</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {vivaEvaluation && (
            <div className="p-5 rounded-xl bg-[#F4F8F4] border border-[#CBE0CC] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-sm font-bold text-[#14532D]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verdict: {vivaEvaluation.verdict}</span>
                </div>
                <span className="font-mono text-sm font-bold text-[#172119] tabular-nums">
                  {vivaEvaluation.scoreOutOf5} / 5
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#243026] leading-relaxed">
                <span className="font-semibold">Examiner Remark: </span>
                {vivaEvaluation.examinerRemark}
              </p>

              <div className="pt-2 border-t border-[#DCEAD9] text-xs text-[#2D3A30] leading-relaxed">
                <span className="font-semibold text-[#14532D]">Ideal Viva Answer: </span>
                {vivaEvaluation.idealShortAnswer}
              </div>

              <button
                type="button"
                onClick={handleNextVivaQuestion}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534]"
              >
                <span>Continue Viva</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'flashcards' && activeCard && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white border border-[#DCE4DC] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E8EEE7]">
              <div className="text-xs font-mono text-[#5A6A5D] tabular-nums">
                Card {cardIndex + 1} of {categoryCards.length} · {activeCategoryMeta?.label}
              </div>
              <button
                type="button"
                onClick={handleGenerateFreshCards}
                disabled={generatingDeck}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#14532D] bg-[#EFF5EF] border border-[#C7D8C7] rounded-lg hover:bg-[#E2EDE2] disabled:opacity-55"
              >
                {generatingDeck ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding 5 Cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate 5 More AI Cards</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#172119]">{activeCard.title}</h2>
              <div className="mt-1 text-base italic font-medium text-[#14532D]">
                {activeCard.scientificOrTechnicalSubtitle}
              </div>
              <div className="mt-2 text-xs text-[#5A6A5D]">{activeCard.classificationOrPrinciple}</div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#3F4E42] mb-2">
                Spot Identification &amp; Practical Diagnostics
              </h3>
              <ul className="space-y-2 text-sm text-[#243026] list-disc pl-5 leading-relaxed">
                {activeCard.identifyingFeatures.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-[#F7F6F1] border border-[#E5DEC9]">
              <div className="text-xs font-semibold text-[#854D0E]">Practical Significance</div>
              <p className="mt-1 text-xs text-[#3F3420] leading-relaxed">
                {activeCard.practicalSignificance}
              </p>
            </div>

            <div className="border border-[#DCE4DC] rounded-lg p-4 bg-[#FAFBF9]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[#14532D]">Viva Examiner Question</div>
                  <p className="mt-1 text-sm font-medium text-[#172119]">{activeCard.vivaQuestion}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVivaAnswer((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#14532D] bg-white border border-[#CFDAD0] rounded-lg hover:bg-[#EFF5EF] shrink-0"
                >
                  {showVivaAnswer ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reveal</span>
                    </>
                  )}
                </button>
              </div>
              {showVivaAnswer && (
                <div className="mt-3 pt-3 border-t border-[#E8EEE7] text-xs text-[#243026] leading-relaxed">
                  <span className="font-semibold text-[#14532D]">Model Reply: </span>
                  {activeCard.vivaAnswer}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setCardIndex((prev) => (prev - 1 + categoryCards.length) % categoryCards.length);
                  setShowVivaAnswer(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE4DC] text-[#172119] hover:bg-[#F1F5F0]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardIndex((prev) => (prev + 1) % categoryCards.length);
                  setShowVivaAnswer(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534]"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <aside className="lg:col-span-4 bg-white border border-[#DCE4DC] rounded-xl overflow-hidden">
            {!labImgError ? (
              <img
                src="/src/assets/images/agri_lab_practical_1795547906052.jpg"
                alt="Agricultural practical laboratory instruments"
                referrerPolicy="no-referrer"
                onError={() => setLabImgError(true)}
                className="w-full h-44 object-cover border-b border-[#E8EEE7]"
              />
            ) : (
              <div className="h-44 bg-[#EFF4EE] border-b border-[#E8EEE7] flex flex-col items-center justify-center p-4 text-center">
                <Microscope className="w-8 h-8 text-[#14532D] mb-1.5" />
                <div className="text-xs font-semibold text-[#172119]">Practical Lab Bench</div>
              </div>
            )}

            <div className="p-4">
              <div className="text-xs font-semibold text-[#172119] mb-2.5">
                {activeCategoryMeta?.label} ({categoryCards.length})
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {categoryCards.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCardIndex(idx);
                      setShowVivaAnswer(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      idx === cardIndex
                        ? 'bg-[#14532D] text-white font-medium'
                        : 'bg-[#FAFBF9] text-[#2D3A30] hover:bg-[#EFF4EE]'
                    }`}
                  >
                    {idx + 1}. {c.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
