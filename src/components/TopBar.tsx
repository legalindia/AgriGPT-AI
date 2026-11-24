import { BookOpen, Plus } from 'lucide-react';
import { MainTab } from '../types';

interface TopBarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenSyllabus: () => void;
  onNewChat: () => void;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onOpenSyllabus,
  onNewChat,
}: TopBarProps) {
  const navItems: { id: string; label: string; active: boolean; onClick: () => void }[] = [
    {
      id: 'chat',
      label: 'AI Doubt Solver',
      active: activeTab === 'chat',
      onClick: () => onSelectTab('chat'),
    },
    {
      id: 'syllabus',
      label: 'ICAR Syllabus',
      active: false,
      onClick: onOpenSyllabus,
    },
    {
      id: 'mock',
      label: 'Mock Test & Quiz',
      active: activeTab === 'mock',
      onClick: () => onSelectTab('mock'),
    },
    {
      id: 'evaluator',
      label: '5 & 10 Mark Evaluator',
      active: activeTab === 'evaluator',
      onClick: () => onSelectTab('evaluator'),
    },
    {
      id: 'practical',
      label: 'Practical & Viva',
      active: activeTab === 'practical',
      onClick: () => onSelectTab('practical'),
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#E3EAE3]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('chat');
          }}
          className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#14532D] whitespace-nowrap shrink-0"
        >
          AgriGPT India
        </a>

        {/* Zone 2: 5 single-line functional navigation items */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] ${
                item.active
                  ? 'text-[#14532D] font-semibold'
                  : 'text-[#4B5B4E] hover:text-[#172119]'
              }`}
            >
              {item.label}
              {item.active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#14532D]"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSyllabus}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#172119] bg-[#F4F7F4] border border-[#DCE4DC] rounded-lg whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#14532D]" />
            <span>Syllabus</span>
          </button>
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#14532D] rounded-lg hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet horizontal nav strip */}
      <nav
        className="lg:hidden flex items-center overflow-x-auto border-t border-[#EDF2ED] px-4 gap-5 bg-[#FAFBF9]"
        aria-label="Mobile navigation"
      >
        {navItems
          .filter((item) => item.id !== 'syllabus')
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`relative py-2.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                item.active ? 'text-[#14532D] font-semibold' : 'text-[#4B5B4E]'
              }`}
            >
              {item.label}
              {item.active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[#14532D]"
                />
              )}
            </button>
          ))}
      </nav>
    </header>
  );
}
