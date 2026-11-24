export type MainTab = 'chat' | 'mock' | 'evaluator' | 'practical';

export type AnswerStyle = 'english' | 'hinglish';

export type MarksFilter = 'Auto' | '2 Marks' | '5 Marks' | '10 Marks' | 'MCQ';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  answerStyle?: AnswerStyle;
  marksFilter?: MarksFilter;
  subjectContext?: string;
  isStreaming?: boolean;
  statusText?: string;
  error?: boolean;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: string;
  semester: number;
  topics: string[];
}

export type QuizCount = 5 | 10 | 20;
export type QuizDifficulty = 'University Semester' | 'ICAR JRF / IBPS AFO';

export interface McqQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Factual' | 'Conceptual' | 'Application';
  subtopic: string;
}

export interface SubjectiveQuestion {
  question: string;
  marks: 5 | 10;
  contextHint: string;
  expectedWordCount: number;
}

export interface SubjectiveEvaluation {
  scoreOutOf10: number;
  rubricBreakdown: {
    conceptualClarity: number;
    scientificTerminology: number;
    structureAndCompleteness: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  examinerFeedback: string;
  modelAnswerOutline: string[];
}

export type PracticalCategory =
  | 'weeds'
  | 'pests'
  | 'diseases'
  | 'soil_instruments'
  | 'fertilizers';

export interface PracticalCard {
  id: string;
  category: PracticalCategory;
  title: string;
  scientificOrTechnicalSubtitle: string;
  classificationOrPrinciple: string;
  identifyingFeatures: string[];
  practicalSignificance: string;
  vivaQuestion: string;
  vivaAnswer: string;
}

export interface VivaEvaluation {
  scoreOutOf5: number;
  verdict: 'Spot On' | 'Partially Correct' | 'Needs Revision';
  examinerRemark: string;
  idealShortAnswer: string;
}

export interface AttemptRecord {
  id: string;
  type: 'mcq' | 'subjective' | 'viva';
  subjectName: string;
  topic: string;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  timestamp: string;
}
