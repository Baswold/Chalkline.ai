import React, { useState, useEffect, useRef } from 'react';
import './styles/modern-layout.css';
import AssignmentTray from './components/AssignmentTray';
import WorkArea from './components/WorkArea';
import ChatWidget from './components/ChatWidget';
import Timeline from './components/Timeline';
import CommandPalette, { Command } from './components/CommandPalette';
import { useKeyboardShortcuts, Shortcuts } from './hooks/useKeyboardShortcuts';
import { assignmentsData } from './data/exampleData';
import type { Assignment, WorkTab, AppState } from './types';

function App() {
  const [state, setState] = useState<AppState>({
    activeAssignment: null,
    activeTab: 'DOC',
    tutorMode: 'NORM_CHAT',
    submissions: [],
    timelineEvents: []
  });

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const chatWidgetRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    if (assignmentsData.length > 0) {
      setState(prev => ({
        ...prev,
        activeAssignment: assignmentsData[0]
      }));
    }
  }, []);

  const handleAssignmentSelect = (assignment: Assignment) => {
    setState(prev => ({
      ...prev,
      activeAssignment: assignment,
      tutorMode: 'TRY_FIRST', // Reset to require attempt when switching assignments
      timelineEvents: [
        ...prev.timelineEvents,
        {
          id: `assignment-${Date.now()}`,
          type: 'assignment-opened',
          timestamp: new Date(),
          description: `Opened assignment: ${assignment.title}`,
          assignmentId: assignment.id
        }
      ]
    }));
  };

  const handleTabChange = (tab: WorkTab) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      timelineEvents: [
        ...prev.timelineEvents,
        {
          id: `tab-${Date.now()}`,
          type: 'tab-switch',
          timestamp: new Date(),
          description: `Switched to ${tab} view`,
          assignmentId: prev.activeAssignment?.id
        }
      ]
    }));
  };

  const handleSubmission = (questionId: string, text: string) => {
    const submission = {
      id: `submission-${Date.now()}`,
      questionId,
      text,
      attempts: 1,
      timestamp: new Date(),
      wordCount: text.split(' ').length,
      timeSpent: 0
    };

    setState(prev => ({
      ...prev,
      submissions: [...prev.submissions, submission],
      tutorMode: 'HINTS_ONLY', // Allow hints after submission
      timelineEvents: [
        ...prev.timelineEvents,
        {
          id: `submission-${Date.now()}`,
          type: 'submission',
          timestamp: new Date(),
          description: `Submitted answer (${submission.wordCount} words)`,
          assignmentId: prev.activeAssignment?.id
        }
      ]
    }));
  };

  const handleTutorInteraction = (message: string) => {
    setState(prev => ({
      ...prev,
      timelineEvents: [
        ...prev.timelineEvents,
        {
          id: `tutor-${Date.now()}`,
          type: 'hint-given',
          timestamp: new Date(),
          description: 'AI tutor provided guidance',
          assignmentId: prev.activeAssignment?.id
        }
      ]
    }));
  };

  // Command palette commands
  const commands: Command[] = [
    {
      id: 'open-ai-chat',
      label: 'Open AI Chat',
      description: 'Focus the AI chat widget',
      icon: '💬',
      shortcut: 'Cmd/Ctrl+J',
      action: () => {
        // Find and click the chat widget toggle
        const chatToggle = document.querySelector('.chat-widget-toggle') as HTMLButtonElement;
        if (chatToggle) chatToggle.click();
      },
      category: 'AI Assistant'
    },
    {
      id: 'tab-document',
      label: 'Switch to Document',
      description: 'Go to document editor',
      icon: '▤',
      shortcut: 'Cmd/Ctrl+1',
      action: () => handleTabChange('DOC'),
      category: 'Navigation'
    },
    {
      id: 'tab-pdf',
      label: 'Switch to PDF',
      description: 'Go to PDF annotator',
      icon: '▦',
      shortcut: 'Cmd/Ctrl+2',
      action: () => handleTabChange('PDF'),
      category: 'Navigation'
    },
    {
      id: 'tab-whiteboard',
      label: 'Switch to Whiteboard',
      description: 'Go to digital whiteboard',
      icon: '▧',
      shortcut: 'Cmd/Ctrl+3',
      action: () => handleTabChange('BOARD'),
      category: 'Navigation'
    },
    {
      id: 'next-assignment',
      label: 'Next Assignment',
      description: 'Switch to the next assignment',
      icon: '→',
      action: () => {
        const currentIndex = assignmentsData.findIndex(a => a.id === state.activeAssignment?.id);
        const nextIndex = (currentIndex + 1) % assignmentsData.length;
        handleAssignmentSelect(assignmentsData[nextIndex]);
      },
      category: 'Navigation'
    },
    {
      id: 'prev-assignment',
      label: 'Previous Assignment',
      description: 'Switch to the previous assignment',
      icon: '←',
      action: () => {
        const currentIndex = assignmentsData.findIndex(a => a.id === state.activeAssignment?.id);
        const prevIndex = currentIndex <= 0 ? assignmentsData.length - 1 : currentIndex - 1;
        handleAssignmentSelect(assignmentsData[prevIndex]);
      },
      category: 'Navigation'
    },
    ...assignmentsData.map(assignment => ({
      id: `assignment-${assignment.id}`,
      label: assignment.title,
      description: assignment.subject,
      icon: '📝',
      action: () => handleAssignmentSelect(assignment),
      category: 'Assignments'
    })),
    {
      id: 'show-shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'Show all available keyboard shortcuts',
      icon: '⌨️',
      shortcut: 'Shift+?',
      action: () => setShowShortcutsHelp(true),
      category: 'Help'
    }
  ];

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      Shortcuts.COMMAND_PALETTE(() => setShowCommandPalette(true)),
      Shortcuts.OPEN_AI_CHAT(() => {
        const chatToggle = document.querySelector('.chat-widget-toggle') as HTMLButtonElement;
        if (chatToggle) chatToggle.click();
      }),
      Shortcuts.TAB_1(() => handleTabChange('DOC')),
      Shortcuts.TAB_2(() => handleTabChange('PDF')),
      Shortcuts.TAB_3(() => handleTabChange('BOARD')),
      Shortcuts.HELP(() => setShowShortcutsHelp(true)),
      Shortcuts.ESCAPE(() => {
        setShowCommandPalette(false);
        setShowShortcutsHelp(false);
      })
    ]
  });

  return (
    <div className="layout">
      <header className="header">
        <div className="header-logo">Chalkline.AI</div>
        <div className="header-breadcrumb">
          <span>Studio</span>
          <span>•</span>
          <span>{state.activeAssignment?.subject || 'Select Assignment'}</span>
          <span>•</span>
          <span className="current">
            {state.activeAssignment?.title || 'No Assignment'}
          </span>
        </div>
      </header>

      <AssignmentTray
        assignments={assignmentsData}
        activeAssignment={state.activeAssignment}
        onAssignmentSelect={handleAssignmentSelect}
      />

      <WorkArea
        activeTab={state.activeTab}
        activeAssignment={state.activeAssignment}
        onTabChange={handleTabChange}
        onSubmission={handleSubmission}
        submissions={state.submissions}
      />

      <ChatWidget
        mode={state.tutorMode}
        activeAssignment={state.activeAssignment}
        submissions={state.submissions}
        onInteraction={handleTutorInteraction}
      />

      <Timeline
        events={state.timelineEvents}
        activeAssignment={state.activeAssignment}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
      />

      {showShortcutsHelp && (
        <div className="shortcuts-help-overlay" onClick={() => setShowShortcutsHelp(false)}>
          <div className="shortcuts-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-help-header">
              <h2>⌨️ Keyboard Shortcuts</h2>
              <button
                className="shortcuts-help-close"
                onClick={() => setShowShortcutsHelp(false)}
              >
                ×
              </button>
            </div>
            <div className="shortcuts-help-content">
              <div className="shortcuts-section">
                <h3>Navigation</h3>
                <div className="shortcut-item">
                  <span className="shortcut-keys"><kbd>Cmd/Ctrl</kbd> + <kbd>1</kbd></span>
                  <span>Switch to Document</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys"><kbd>Cmd/Ctrl</kbd> + <kbd>2</kbd></span>
                  <span>Switch to PDF</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys"><kbd>Cmd/Ctrl</kbd> + <kbd>3</kbd></span>
                  <span>Switch to Whiteboard</span>
                </div>
              </div>

              <div className="shortcuts-section">
                <h3>AI Assistant</h3>
                <div className="shortcut-item">
                  <span className="shortcut-keys"><kbd>Cmd/Ctrl</kbd> + <kbd>J</kbd></span>
                  <span>Open AI Chat</span>
                </div>
              </div>

              <div className="shortcuts-section">
                <h3>General</h3>
                <div className="shortcut-item">
                  <span className="shortcut-keys"><kbd>Cmd/Ctrl</kbd> + <kbd>/</kbd></span>
                  <span>Open Command Palette</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys"><kbd>Shift</kbd> + <kbd>?</kbd></span>
                  <span>Show Keyboard Shortcuts</span>
                </div>
                <div className="shortcut-item">
                  <span className="shortcut-keys"><kbd>Esc</kbd></span>
                  <span>Close Dialogs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .shortcuts-help-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(2px);
        }

        .shortcuts-help-modal {
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.2s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .shortcuts-help-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--gray-200);
        }

        .shortcuts-help-header h2 {
          margin: 0;
          font-size: var(--text-2xl);
          color: var(--gray-800);
        }

        .shortcuts-help-close {
          width: 32px;
          height: 32px;
          border: none;
          background: var(--gray-100);
          border-radius: var(--radius-md);
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-600);
          transition: all var(--transition-fast);
        }

        .shortcuts-help-close:hover {
          background: var(--gray-200);
          color: var(--gray-800);
        }

        .shortcuts-help-content {
          padding: var(--space-lg);
          overflow-y: auto;
        }

        .shortcuts-section {
          margin-bottom: var(--space-xl);
        }

        .shortcuts-section:last-child {
          margin-bottom: 0;
        }

        .shortcuts-section h3 {
          margin: 0 0 var(--space-md) 0;
          font-size: var(--text-lg);
          color: var(--gray-700);
          font-weight: 600;
        }

        .shortcut-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--gray-100);
        }

        .shortcut-item:last-child {
          border-bottom: none;
        }

        .shortcut-item span:last-child {
          color: var(--gray-600);
        }

        .shortcut-keys {
          display: flex;
          gap: var(--space-xs);
          align-items: center;
        }

        .shortcut-keys kbd {
          padding: 4px 8px;
          background: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: var(--text-sm);
          color: var(--gray-700);
          box-shadow: 0 1px 0 var(--gray-300);
        }
      `}</style>
    </div>
  );
}

export default App;
