import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GenerateContentParameters,
  GenerateContentResponse,
  GoogleGenAI,
  ThinkingLevel,
  Type,
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// Primary model with automatic fallback chain (no deprecated models)
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
] as const;

const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
const ATTEMPT_TIMEOUT_MS = 12000;
const FRIENDLY_OVERLOAD_MSG =
  'AI server is currently overloaded. Please wait 5 seconds and click Retry.';

const AGRI_GPT_SYSTEM_INSTRUCTION = `You are AgriGPT India, a strict, highly accurate ICAR B.Sc. (Hons.) Agriculture Subject Matter Expert and University Examiner strictly following the ICAR 5th and 6th Dean's Committee syllabus and standard Indian agricultural textbooks (Reddy & Reddy, N.C. Brady, H.L.S. Tandon, Katyal, B.D. Singh, Atwal, Agrios).

STRICT RESPONSE ENGINE RULES:
1. ZERO FLUFF: Never write generic greetings ("Hello student", "Great question") or filler conclusions. Start directly with the exact answer in the very first sentence.
2. 100% REAL ICAR DATA: Only provide verified, real scientific facts, exact NPK doses (kg/ha), seed rates (kg/ha), spacing (cm), soil classifications, and real Indian crop varieties released by ICAR / SAUs. Never invent or guess data. If a query is outside the B.Sc. (Hons.) Agriculture syllabus or ambiguous, state clearly: "This topic is outside the ICAR B.Sc. (Hons.) Agriculture syllabus; please specify a relevant crop, soil, pest, or syllabus subject."
3. SCIENTIFIC PRECISION: Always italicize scientific names using proper Markdown binomial nomenclature (e.g., *Oryza sativa*, *Triticum aestivum*, *Meloidogyne incognita*, *Parthenium hysterophorus*).
4. STRUCTURED EXAM FORMATTING: Use bold headings (**Definition**, **Principle**, **Classification/Comparison Table**, **Key Examples**), concise bullet points, and Markdown tables so students can copy answers directly into university exam sheets.
5. REAL CITATIONS: Whenever citing Indian statistics, schemes, or recommended crop varieties, mention authentic Indian sources (e.g., ICAR, Ministry of Agriculture & Farmers Welfare, TNAU Agritech Portal, IARI).`;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorDetails(err: unknown): {
  message: string;
  isMissingKey: boolean;
  isAuthError: boolean;
  isModelNotFound: boolean;
  isTransientOverload: boolean;
} {
  const errObj = err as { status?: number; code?: number; message?: string } | undefined;
  const rawMessage = err instanceof Error ? err.message : String(err ?? '');
  const status = errObj?.status ?? errObj?.code;
  const upper = rawMessage.toUpperCase();

  const isMissingKey = upper.includes('GEMINI_API_KEY');
  const isAuthError =
    status === 403 ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('API_KEY_INVALID');
  const isModelNotFound =
    status === 404 ||
    upper.includes('NOT_FOUND') ||
    upper.includes('IS NOT FOUND FOR API VERSION');
  const isTransientOverload =
    status === 503 ||
    status === 429 ||
    upper.includes('503') ||
    upper.includes('429') ||
    upper.includes('UNAVAILABLE') ||
    upper.includes('SERVICE UNAVAILABLE') ||
    upper.includes('HIGH DEMAND') ||
    upper.includes('OVERLOADED') ||
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('ABORT') ||
    upper.includes('TIMEOUT') ||
    upper.includes('ECONNRESET') ||
    upper.includes('ETIMEDOUT');

  return {
    message: rawMessage,
    isMissingKey,
    isAuthError,
    isModelNotFound,
    isTransientOverload,
  };
}

function buildConfigForModel(
  model: string,
  baseConfig?: GenerateContentParameters['config'],
  abortSignal?: AbortSignal
): GenerateContentParameters['config'] {
  const nextConfig: GenerateContentParameters['config'] = {
    ...(baseConfig || {}),
    ...(abortSignal ? { abortSignal } : {}),
  };
  if (model.startsWith('gemini-4-') && !nextConfig.thinkingConfig) {
    nextConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  }
  return nextConfig;
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, 'model'>
): Promise<GenerateContentResponse> {
  let modelIndex = 0;
  let transientRetryCount = 0;
  let lastError: unknown;

  while (modelIndex < MODEL_FALLBACK_CHAIN.length) {
    const model = MODEL_FALLBACK_CHAIN[modelIndex];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
        config: buildConfigForModel(model, params.config, controller.signal),
      });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const info = extractErrorDetails(err);

      if (info.isMissingKey || info.isAuthError) {
        throw err;
      }

      if (info.isModelNotFound) {
        console.warn(`[Gemini Fallback] Model "${model}" unavailable (404). Switching to next fallback.`);
        modelIndex += 1;
        continue;
      }

      if (info.isTransientOverload) {
        if (transientRetryCount < RETRY_DELAYS_MS.length) {
          const delayMs = RETRY_DELAYS_MS[transientRetryCount];
          transientRetryCount += 1;
          const nextModelIndex = Math.min(modelIndex + 1, MODEL_FALLBACK_CHAIN.length - 1);
          console.warn(
            `[Gemini Retry ${transientRetryCount}/${RETRY_DELAYS_MS.length}] "${model}" busy/timed out. Waiting ${delayMs}ms and switching to "${MODEL_FALLBACK_CHAIN[nextModelIndex]}".`
          );
          await sleep(delayMs);
          modelIndex = nextModelIndex;
          continue;
        }
        throw new Error(FRIENDLY_OVERLOAD_MSG);
      }

      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(FRIENDLY_OVERLOAD_MSG);
}

async function streamContentWithRetry(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, 'model'>,
  callbacks: {
    onStatus: (status: string) => void;
    onChunk: (text: string) => void;
    isAborted: () => boolean;
  }
): Promise<void> {
  let modelIndex = 0;
  let transientRetryCount = 0;
  let lastError: unknown;

  while (modelIndex < MODEL_FALLBACK_CHAIN.length) {
    if (callbacks.isAborted()) return;
    const model = MODEL_FALLBACK_CHAIN[modelIndex];
    let emittedText = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (!emittedText) controller.abort();
    }, ATTEMPT_TIMEOUT_MS);

    try {
      const stream = await ai.models.generateContentStream({
        ...params,
        model,
        config: buildConfigForModel(model, params.config, controller.signal),
      });

      for await (const chunk of stream) {
        if (callbacks.isAborted()) {
          clearTimeout(timer);
          return;
        }
        const text = chunk.text;
        if (text) {
          if (!emittedText) {
            clearTimeout(timer);
            emittedText = true;
          }
          callbacks.onChunk(text);
        }
      }
      clearTimeout(timer);
      return;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      const info = extractErrorDetails(err);

      if (info.isMissingKey || info.isAuthError || emittedText) {
        throw err;
      }

      if (info.isModelNotFound) {
        console.warn(`[Gemini Stream Fallback] Model "${model}" unavailable (404). Switching to next model.`);
        modelIndex += 1;
        continue;
      }

      if (info.isTransientOverload) {
        if (transientRetryCount < RETRY_DELAYS_MS.length) {
          const delayMs = RETRY_DELAYS_MS[transientRetryCount];
          transientRetryCount += 1;
          const nextModelIndex = Math.min(modelIndex + 1, MODEL_FALLBACK_CHAIN.length - 1);
          console.warn(
            `[Gemini Stream Retry ${transientRetryCount}/${RETRY_DELAYS_MS.length}] "${model}" busy/timed out. Retrying on "${MODEL_FALLBACK_CHAIN[nextModelIndex]}" in ${delayMs}ms.`
          );
          callbacks.onStatus('Server busy, retrying automatically...');
          await sleep(delayMs);
          modelIndex = nextModelIndex;
          continue;
        }
        throw new Error(FRIENDLY_OVERLOAD_MSG);
      }

      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(FRIENDLY_OVERLOAD_MSG);
}

function handleGeminiError(res: Response, err: unknown, fallbackMsg: string) {
  console.error('[Gemini API Error]', err);
  const info = extractErrorDetails(err);
  if (info.isMissingKey) {
    return res.status(500).json({
      error: 'Gemini API key is missing. Please configure GEMINI_API_KEY in Settings > Secrets.',
    });
  }
  if (info.isAuthError) {
    return res.status(403).json({
      error: 'Invalid or unauthorized Gemini API key. Please verify your key in Settings > Secrets.',
    });
  }
  if (info.isTransientOverload || info.message === FRIENDLY_OVERLOAD_MSG) {
    return res.status(503).json({
      error: FRIENDLY_OVERLOAD_MSG,
    });
  }
  return res.status(500).json({ error: info.message || fallbackMsg });
}

function sanitizeString(value: unknown, maxLen = 400): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Streaming ChatGPT/Gemini-style AI Doubt Solver (SSE) with Retry & Fallback
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    let clientClosed = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientClosed = true;
      }
    });

    try {
      const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
      const answerStyle = req.body?.answerStyle === 'hinglish' ? 'hinglish' : 'english';
      const marksFilter = sanitizeString(req.body?.marksFilter, 30) || 'Auto';
      const subjectContext = sanitizeString(req.body?.subjectContext, 180);

      const cleanedMessages = rawMessages
        .slice(-10)
        .map((m: { role?: unknown; content?: unknown }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: sanitizeString(m.content, 3000),
        }))
        .filter((m: { role: string; text: string }) => m.text.length > 0);

      if (cleanedMessages.length === 0) {
        return res.status(400).json({ error: 'Please enter a question to ask AgriGPT India.' });
      }

      const styleInstruction =
        answerStyle === 'hinglish'
          ? 'LANGUAGE MODE: Easy Hinglish — explain concepts in clear, direct conversational Hindi written in Roman script mixed with exact English agricultural terminology. Keep all binomial scientific names italicized, chemical formulas, table headers, and ICAR metrics in exact academic English.'
          : 'LANGUAGE MODE: Exam-Ready Academic English — crisp, formal, university answer-sheet prose.';

      let marksInstruction = '';
      if (marksFilter === '2 Marks') {
        marksInstruction =
          'FORMAT CONSTRAINT (2 Marks Short Note): Answer in 4–5 crisp bullet points with key technical terms, binomials, and exact metrics. No long paragraphs.';
      } else if (marksFilter === '5 Marks') {
        marksInstruction =
          'FORMAT CONSTRAINT (5 Marks University Answer): Structure strictly with **Definition**, **Principle**, **Classification/Comparison Table** (Markdown table), and **Key Examples** (with ICAR/SAU varieties or doses).';
      } else if (marksFilter === '10 Marks') {
        marksInstruction =
          'FORMAT CONSTRAINT (10 Marks Long Answer): Comprehensive university answer sheet with **Definition**, **Principle**, **Mechanism / Agronomic Package**, **Classification/Comparison Table** (Markdown table with exact Indian metrics like kg/ha, cm, NPK), **Key Examples**, and **Sources**.';
      } else if (marksFilter === 'MCQ') {
        marksInstruction =
          'FORMAT CONSTRAINT (MCQ Practice Mode): Generate 3 high-yield ICAR JRF / IBPS AFO practice MCQs on this topic with Options (A–D), followed by a clean **Answer Key & Scientific Explanation** section.';
      } else {
        marksInstruction =
          'FORMAT CONSTRAINT (Auto): Match depth intelligently to the user query. Use structured headings (**Definition**, **Principle**, **Classification/Comparison Table**, **Key Examples**) and Markdown tables whenever comparing concepts or detailing crop/soil/pest topics.';
      }

      const contextBanner = subjectContext ? `Active Syllabus Context: ${subjectContext}\n` : '';

      const contents = cleanedMessages.map((m: { role: string; text: string }, idx: number) => {
        if (idx === cleanedMessages.length - 1 && m.role === 'user') {
          return {
            role: m.role,
            parts: [
              {
                text: `${contextBanner}${styleInstruction}\n${marksInstruction}\n\nStudent Query: ${m.text}`,
              },
            ],
          };
        }
        return {
          role: m.role,
          parts: [{ text: m.text }],
        };
      });

      const ai = getGeminiClient();

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      res.write(': connected\n\n');

      await streamContentWithRetry(
        ai,
        {
          contents,
          config: {
            systemInstruction: AGRI_GPT_SYSTEM_INSTRUCTION,
          },
        },
        {
          isAborted: () => clientClosed,
          onStatus: (status) => {
            if (!clientClosed) {
              res.write(`data: ${JSON.stringify({ status })}\n\n`);
            }
          },
          onChunk: (text) => {
            if (!clientClosed) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          },
        }
      );

      if (!clientClosed) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      }
      return undefined;
    } catch (err) {
      if (!res.headersSent) {
        return handleGeminiError(res, err, FRIENDLY_OVERLOAD_MSG);
      }
      if (!clientClosed) {
        const info = extractErrorDetails(err);
        const userMessage =
          info.isTransientOverload || info.message === FRIENDLY_OVERLOAD_MSG
            ? FRIENDLY_OVERLOAD_MSG
            : info.message || FRIENDLY_OVERLOAD_MSG;
        res.write(`data: ${JSON.stringify({ error: userMessage })}\n\n`);
        return res.end();
      }
      return undefined;
    }
  });

  // 2. Mock Test & Quiz Generator (5, 10, or 20 MCQs)
  app.post('/api/test/mcq', async (req: Request, res: Response) => {
    try {
      const subjectName = sanitizeString(req.body?.subjectName, 160);
      const topic = sanitizeString(req.body?.topic, 220) || 'Core ICAR Syllabus Topics';
      const rawCount = Number(req.body?.questionCount);
      const questionCount = rawCount === 5 || rawCount === 20 ? rawCount : 10;
      const difficulty = sanitizeString(req.body?.difficulty, 80) || 'ICAR JRF / IBPS AFO';

      if (!subjectName) {
        return res.status(400).json({ error: 'Subject name is required.' });
      }

      const ai = getGeminiClient();
      const prompt = `Generate exactly ${questionCount} factually verified multiple-choice questions (MCQs) for Indian B.Sc. (Hons.) Agriculture students.
Subject: ${subjectName}
Focus Topic: ${topic}
Exam Difficulty Level: ${difficulty}

Guidelines:
- Strictly adhere to ICAR 5th/6th Dean's syllabus and authentic Indian agricultural data (exact NPK ratios, seed rates kg/ha, spacing, ICAR varieties, entomological/pathological causal organisms, soil classifications).
- Mix Factual, Conceptual, and Field Application questions appropriate for ${difficulty}.
- Each question must have exactly 4 distinct options (do NOT prefix options with A., B., C., D.).
- correctIndex must be 0, 1, 2, or 3.
- Provide a crisp 2-sentence scientific explanation citing the factual basis.`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: AGRI_GPT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    subtopic: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'question',
                    'options',
                    'correctIndex',
                    'explanation',
                    'difficulty',
                    'subtopic',
                  ],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to generate MCQ mock test.');
    }
  });

  // 3. Generate a 5-Mark or 10-Mark University Exam Question
  app.post('/api/test/subjective-question', async (req: Request, res: Response) => {
    try {
      const subjectName = sanitizeString(req.body?.subjectName, 160);
      const topic = sanitizeString(req.body?.topic, 220);
      const marks = Number(req.body?.marks) === 5 ? 5 : 10;

      if (!subjectName || !topic) {
        return res.status(400).json({ error: 'Subject name and topic are required.' });
      }

      const ai = getGeminiClient();
      const prompt = `Create 1 authentic ${marks}-mark State Agricultural University (SAU / ICAR) semester theory exam question for B.Sc. (Hons.) Agriculture.
Subject: ${subjectName}
Topic: ${topic}
Marks: ${marks}

Include a concise context hint (what examiners look for: definition, mechanism, classification table, doses/varieties) and expectedWordCount (${marks === 5 ? '150' : '300'}).`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: AGRI_GPT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              marks: { type: Type.INTEGER },
              contextHint: { type: Type.STRING },
              expectedWordCount: { type: Type.INTEGER },
            },
            required: ['question', 'marks', 'contextHint', 'expectedWordCount'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to generate subjective question.');
    }
  });

  // 4. Evaluate Subjective Answer strictly like an Indian Agriculture University Professor
  app.post('/api/test/subjective-evaluate', async (req: Request, res: Response) => {
    try {
      const subjectName = sanitizeString(req.body?.subjectName, 160);
      const topic = sanitizeString(req.body?.topic, 220);
      const question = sanitizeString(req.body?.question, 500);
      const marks = Number(req.body?.marks) === 5 ? 5 : 10;
      const studentAnswer = sanitizeString(req.body?.studentAnswer, 6000);

      if (!question || !studentAnswer || studentAnswer.length < 15) {
        return res.status(400).json({
          error: 'Please write a meaningful answer (at least 15 characters) before submitting.',
        });
      }

      const ai = getGeminiClient();
      const prompt = `You are a strict Indian Agricultural University (SAU / ICAR) professor grading a B.Sc. (Hons.) Agriculture exam script.
Subject: ${subjectName}
Topic: ${topic}
Original Question (${marks}-Mark Pattern): ${question}

Student's Written Answer:
"""
${studentAnswer}
"""

Grade this answer strictly out of 10 (normalize to a 0.0–10.0 scale even for 5-mark pattern):
- conceptualClarity (out of 4)
- scientificTerminology (out of 3 — check binomials, exact terms, doses)
- structureAndCompleteness (out of 3 — check headings, examples, table/classification)
Ensure the 3 rubric scores sum up to scoreOutOf10.

Also provide:
- matchedKeywords: technical terms/facts the student included correctly (3–6 items)
- missingKeywords: crucial ICAR exam keywords, binomials, doses, or varieties the student missed (3–6 items)
- examinerFeedback: strict, direct, actionable professor feedback (3–4 sentences, zero fluff)
- modelAnswerOutline: 4–6 structured bullet points showing what earns 9+/10.`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: AGRI_GPT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scoreOutOf10: { type: Type.NUMBER },
              rubricBreakdown: {
                type: Type.OBJECT,
                properties: {
                  conceptualClarity: { type: Type.NUMBER },
                  scientificTerminology: { type: Type.NUMBER },
                  structureAndCompleteness: { type: Type.NUMBER },
                },
                required: [
                  'conceptualClarity',
                  'scientificTerminology',
                  'structureAndCompleteness',
                ],
              },
              matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              examinerFeedback: { type: Type.STRING },
              modelAnswerOutline: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'scoreOutOf10',
              'rubricBreakdown',
              'matchedKeywords',
              'missingKeywords',
              'examinerFeedback',
              'modelAnswerOutline',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to evaluate subjective answer.');
    }
  });

  // 5. Generate Fresh Practical Viva Flashcards
  app.post('/api/viva/generate-deck', async (req: Request, res: Response) => {
    try {
      const category = sanitizeString(req.body?.category, 60);
      const existingTitles = Array.isArray(req.body?.existingTitles)
        ? req.body.existingTitles.slice(0, 14).map((t: unknown) => sanitizeString(t, 80))
        : [];

      const categoryMap: Record<string, string> = {
        weeds:
          'Weeds Identification (Kharif/Rabi crop weeds, italicized binomials, families, morphological clues, herbicide doses)',
        pests:
          'Agricultural Insect Pests (italicized binomials, order/family, damaging stage, symptoms, ETL)',
        diseases:
          'Plant Diseases (causal organisms, diagnostic symptoms, spore morphology, fungicide doses)',
        soil_instruments:
          'Soil & Agro-Meteorological Instruments (pH meter, EC meter, Bouyoucos Hydrometer, Flame Photometer, Core Sampler, Pycnometer, Anemometer, Rain Gauge)',
        fertilizers:
          'Fertilizers & Soil Amendments (NPK grade %, chemical formula, soil pH reaction, FCO standards, crop specificity like CAN, Ammonium Sulphate, MOP, SOP, Zinc Sulphate, Gypsum)',
      };

      const categoryDesc = categoryMap[category] || categoryMap.weeds;

      const ai = getGeminiClient();
      const prompt = `Generate 5 high-yield B.Sc. (Hons.) Agriculture practical exam flashcards for: ${categoryDesc}.
${existingTitles.length > 0 ? `Do NOT repeat these already-seen items: ${existingTitles.join(', ')}.` : ''}

Each card must include:
- title (common Indian & academic name)
- scientificOrTechnicalSubtitle (binomial nomenclature or chemical formula / instrument type)
- classificationOrPrinciple (Family/Order or Grade % / Analytical Principle)
- identifyingFeatures (3 crisp diagnostic points for practical spot identification)
- practicalSignificance (1–2 sentences with exact Indian agronomic/lab metrics)
- vivaQuestion (sharp external-examiner viva question)
- vivaAnswer (concise, accurate 2-sentence answer).`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: AGRI_GPT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    scientificOrTechnicalSubtitle: { type: Type.STRING },
                    classificationOrPrinciple: { type: Type.STRING },
                    identifyingFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                    practicalSignificance: { type: Type.STRING },
                    vivaQuestion: { type: Type.STRING },
                    vivaAnswer: { type: Type.STRING },
                  },
                  required: [
                    'title',
                    'scientificOrTechnicalSubtitle',
                    'classificationOrPrinciple',
                    'identifyingFeatures',
                    'practicalSignificance',
                    'vivaQuestion',
                    'vivaAnswer',
                  ],
                },
              },
            },
            required: ['cards'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to generate practical flashcards.');
    }
  });

  // 6. Rapid-Fire Viva Answer Evaluation
  app.post('/api/viva/evaluate', async (req: Request, res: Response) => {
    try {
      const question = sanitizeString(req.body?.question, 500);
      const studentAnswer = sanitizeString(req.body?.studentAnswer, 1500);
      const referenceAnswer = sanitizeString(req.body?.referenceAnswer, 800);

      if (!question || !studentAnswer) {
        return res.status(400).json({ error: 'Question and viva response are required.' });
      }

      const ai = getGeminiClient();
      const prompt = `You are an external practical viva examiner for B.Sc. (Hons.) Agriculture.
Viva Question: ${question}
Reference Fact: ${referenceAnswer}
Student's Rapid-Fire Answer: "${studentAnswer}"

Evaluate strictly:
- scoreOutOf5 (integer 0 to 5)
- verdict: exactly one of "Spot On", "Partially Correct", or "Needs Revision"
- examinerRemark: 1–2 direct sentences of viva feedback
- idealShortAnswer: concise 1–2 sentence model viva reply.`;

      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: AGRI_GPT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scoreOutOf5: { type: Type.INTEGER },
              verdict: { type: Type.STRING },
              examinerRemark: { type: Type.STRING },
              idealShortAnswer: { type: Type.STRING },
            },
            required: ['scoreOutOf5', 'verdict', 'examinerRemark', 'idealShortAnswer'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err) {
      return handleGeminiError(res, err, 'Failed to evaluate viva response.');
    }
  });

  // Vite dev middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriGPT India server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
