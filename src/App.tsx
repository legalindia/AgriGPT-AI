/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { ChatDoubtSolver } from './components/ChatDoubtSolver';
import { MarkEvaluatorTab } from './components/MarkEvaluatorTab';
import { MockQuizTab, QuizPreset } from './components/MockQuizTab';
import { PracticalVivaTab } from './components/PracticalVivaTab';
import { SyllabusDrawer } from './components/SyllabusDrawer';
import { TopBar } from './components/TopBar';
import {
  AnswerStyle,
  AttemptRecord,
  ChatMessage,
  MainTab,
  MarksFilter,
  QuizCount,
  QuizDifficulty,
  SubjectItem,
} from './types';

const STORAGE_ATTEMPTS_KEY = 'agrigpt_india_attempts_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('chat');
  const [syllabusOpen, setSyllabusOpen] = useState(false);

  // Chat Doubt Solver state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>('english');
  const [marksFilter, setMarksFilter] = useState<MarksFilter>('Auto');
  const [activeSubjectContext, setActiveSubjectContext] = useState<SubjectItem | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Quick Quiz Preset (for Chip #3: 5-question ICAR JRF Soil Science mock test)
  const [quizPreset, setQuizPreset] = useState<QuizPreset | null>(null);

  // Attempt analytics persisted locally
  const [attempts, setAttempts] = useState<AttemptRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ATTEMPTS_KEY);
      return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ATTEMPTS_KEY, JSON.stringify(attempts));
    } catch {
      // Storage quota ignored
    }
  }, [attempts]);

  const handleRecordAttempt = (attempt: AttemptRecord) => {
    setAttempts((prev) => [attempt, ...prev]);
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages([]);
    setActiveSubjectContext(null);
    setActiveTab('chat');
  };

  const streamIntoAssistant = async (
    historyForApi: { role: 'user' | 'assistant'; content: string }[],
    assistantId: string,
    style: AnswerStyle,
    marks: MarksFilter,
    subjectObj: SubjectItem | null
  ) => {
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historyForApi,
          answerStyle: style,
          marksFilter: marks,
          subjectContext: subjectObj
            ? `Semester ${subjectObj.semester} · ${subjectObj.code} — ${subjectObj.name}`
            : '',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || 'AI server is currently overloaded. Please wait 5 seconds and click Retry.'
        );
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response body unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data:')) continue;
          const payloadStr = trimmedLine.slice(5).trim();
          if (!payloadStr) continue;

          try {
            const payload = JSON.parse(payloadStr) as {
              text?: string;
              status?: string;
              done?: boolean;
              error?: string;
            };
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.status) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, statusText: payload.status, isStreaming: true }
                    : m
                )
              );
            }
            if (payload.text) {
              accumulated += payload.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, statusText: undefined, isStreaming: true }
                    : m
                )
              );
            }
            if (payload.done) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, statusText: undefined, isStreaming: false }
                    : m
                )
              );
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, statusText: undefined, isStreaming: false } : m
        )
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const errMsg =
        err instanceof Error
          ? err.message
          : 'AI server is currently overloaded. Please wait 5 seconds and click Retry.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: errMsg, statusText: undefined, isStreaming: false, error: true }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async (
    text: string,
    style: AnswerStyle,
    marks: MarksFilter,
    overrideSubject?: SubjectItem | null
  ) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const subjectObj = overrideSubject !== undefined ? overrideSubject : activeSubjectContext;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      answerStyle: style,
      marksFilter: marks,
      subjectContext: subjectObj ? `${subjectObj.code} ${subjectObj.name}` : undefined,
    };

    const assistantId = `assistant-${Date.now() + 1}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    const historyForApi = [...messages, userMsg]
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    setMessages((prev) => [...prev, userMsg, placeholderAssistant]);
    setActiveTab('chat');
    await streamIntoAssistant(historyForApi, assistantId, style, marks, subjectObj);
  };

  const handleRetryMessage = async (failedAssistantId: string) => {
    if (isStreaming) return;
    const failedIdx = messages.findIndex((m) => m.id === failedAssistantId);
    if (failedIdx <= 0) return;

    const precedingUser = messages[failedIdx - 1];
    if (!precedingUser || precedingUser.role !== 'user') return;

    const historyForApi = messages
      .slice(0, failedIdx)
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    setMessages((prev) =>
      prev.map((m) =>
        m.id === failedAssistantId
          ? {
              ...m,
              content: '',
              error: false,
              isStreaming: true,
              statusText: 'Reconnecting to AgriGPT India...',
            }
          : m
      )
    );

    await streamIntoAssistant(
      historyForApi,
      failedAssistantId,
      precedingUser.answerStyle || answerStyle,
      precedingUser.marksFilter || marksFilter,
      activeSubjectContext
    );
  };

  const handleLoadTopicInChat = (promptText: string, subject: SubjectItem) => {
    setActiveSubjectContext(subject);
    setActiveTab('chat');
    handleSendMessage(promptText, answerStyle, marksFilter, subject);
  };

  const handleStartQuickQuiz = (
    subjectName: string,
    count: QuizCount,
    difficulty: QuizDifficulty
  ) => {
    setQuizPreset({
      subjectName,
      count,
      difficulty,
      nonce: Date.now(),
    });
    setActiveTab('mock');
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-white text-[#172119]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSyllabus={() => setSyllabusOpen(true)}
        onNewChat={handleNewChat}
      />

      <SyllabusDrawer
        open={syllabusOpen}
        onClose={() => setSyllabusOpen(false)}
        onLoadTopicInChat={handleLoadTopicInChat}
      />

      <main className="flex-1 flex flex-col bg-[#FAFBF9]">
        {activeTab === 'chat' && (
          <ChatDoubtSolver
            messages={messages}
            onSendMessage={(text, style, marks) => handleSendMessage(text, style, marks)}
            onRetryMessage={handleRetryMessage}
            answerStyle={answerStyle}
            onChangeAnswerStyle={setAnswerStyle}
            marksFilter={marksFilter}
            onChangeMarksFilter={setMarksFilter}
            activeSubjectContext={activeSubjectContext}
            onClearSubjectContext={() => setActiveSubjectContext(null)}
            isStreaming={isStreaming}
            onStartQuickQuiz={handleStartQuickQuiz}
          />
        )}

        {activeTab === 'mock' && (
          <MockQuizTab preset={quizPreset} onRecordAttempt={handleRecordAttempt} />
        )}

        {activeTab === 'evaluator' && (
          <MarkEvaluatorTab onRecordAttempt={handleRecordAttempt} />
        )}

        {activeTab === 'practical' && (
          <PracticalVivaTab onRecordAttempt={handleRecordAttempt} />
        )}
      </main>
    </div>
  );
}
