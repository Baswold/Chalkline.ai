import React, { useState, useEffect, useRef } from 'react';
import './styles/modern-layout.css';
import './styles/keybinds.css';
import AssignmentTray from './components/AssignmentTray';
import WorkArea from './components/WorkArea';
import ChatWidget from './components/ChatWidget';
import Timeline from './components/Timeline';
import HintPopover, { type Hint } from './components/HintPopover';
import InlineSuggestion, { type Suggestion } from './components/InlineSuggestion';
import CommandPalette from './components/CommandPalette';
import { installKeybinds, type KeybindEvent, type KeybindManager } from './lib/keybinds';
import { defaultCommands } from './lib/commands';
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

  // Keybinds state
  const [showHints, setShowHints] = useState(false);
  const [hints, setHints] = useState<Hint[]>([]);
  const [hintsLoading, setHintsLoading] = useState(false);
  const [showInlineSuggestion, setShowInlineSuggestion] = useState(false);
  const [inlineSuggestion, setInlineSuggestion] = useState<Suggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [keybindPosition, setKeybindPosition] = useState<{ x: number; y: number } | undefined>(undefined);

  const keybindManagerRef = useRef<KeybindManager | null>(null);
  const appRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    if (assignmentsData.length > 0) {
      setState(prev => ({
        ...prev,
        activeAssignment: assignmentsData[0]
      }));
    }
  }, []);

  // Install keybinds on mount
  useEffect(() => {
    if (appRef.current) {
      keybindManagerRef.current = installKeybinds(appRef.current, handleKeybindEvent);
      console.log('✨ Keybinds installed');
    }

    return () => {
      keybindManagerRef.current?.stop();
    };
  }, []);

  // Generate mock hints based on current context
  const generateHints = async (): Promise<Hint[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const mockHints: Hint[] = [
      {
        id: 'hint-1',
        text: 'Start by identifying what type of problem this is. What category does it fall into?',
        type: 'leading-question',
        confidence: 0.92
      },
      {
        id: 'hint-2',
        text: 'Try breaking the problem down into smaller steps. What information are you given?',
        type: 'method',
        confidence: 0.88
      },
      {
        id: 'hint-3',
        text: 'This concept is related to [topic]. Review the key principles before proceeding.',
        type: 'concept',
        confidence: 0.75
      }
    ];

    // Filter based on tutor mode
    if (state.tutorMode === 'TRY_FIRST') {
      return [];
    }

    return mockHints;
  };

  // Generate mock inline suggestion
  const generateSuggestion = async (): Promise<Suggestion> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));

    return {
      id: `suggestion-${Date.now()}`,
      text: 'Consider approaching this by first analyzing the given information, then applying the relevant formula.',
      confidence: 0.85,
      reasoning: 'Based on your current answer and the assignment requirements'
    };
  };

  // Handle keybind events
  const handleKeybindEvent = async (event: KeybindEvent) => {
    console.log('[Keybind Event]', event.type);

    // Update position based on cursor/selection
    const activeElement = document.activeElement;
    if (activeElement) {
      const rect = activeElement.getBoundingClientRect();
      setKeybindPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }

    switch (event.type) {
      case 'hint-request':
        if (state.tutorMode === 'TRY_FIRST') {
          alert('Please make an attempt at the problem first before requesting hints.');
          return;
        }
        setShowHints(true);
        setHintsLoading(true);
        const generatedHints = await generateHints();
        setHints(generatedHints);
        setHintsLoading(false);

        // Log to timeline
        setState(prev => ({
          ...prev,
          timelineEvents: [
            ...prev.timelineEvents,
            {
              id: `hint-${Date.now()}`,
              type: 'hint-given',
              timestamp: new Date(),
              description: 'Requested hints (Hold Space)',
              assignmentId: prev.activeAssignment?.id
            }
          ]
        }));
        break;

      case 'inline-suggestion':
        setShowInlineSuggestion(true);
        setSuggestionLoading(true);
        const suggestion = await generateSuggestion();
        setInlineSuggestion(suggestion);
        setSuggestionLoading(false);
        break;

      case 'command-palette':
        setShowCommandPalette(true);
        break;

      case 'escape':
        setShowHints(false);
        setShowInlineSuggestion(false);
        setShowCommandPalette(false);
        break;
    }
  };

  // Handle hint selection
  const handleHintSelect = (hint: Hint) => {
    console.log('Selected hint:', hint);
    setShowHints(false);

    setState(prev => ({
      ...prev,
      timelineEvents: [
        ...prev.timelineEvents,
        {
          id: `hint-select-${Date.now()}`,
          type: 'hint-given',
          timestamp: new Date(),
          description: `Used hint: ${hint.type}`,
          assignmentId: prev.activeAssignment?.id
        }
      ]
    }));

    // Could send hint to chat widget or insert into editor
    alert(`Selected ${hint.type} hint`);
  };

  // Handle suggestion accept
  const handleSuggestionAccept = (suggestion: Suggestion) => {
    console.log('Accepted suggestion:', suggestion);

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLInputElement) {
      const cursorPos = activeElement.selectionStart || 0;
      const before = activeElement.value.substring(0, cursorPos);
      const after = activeElement.value.substring(cursorPos);
      activeElement.value = before + suggestion.text + after;
    }

    setShowInlineSuggestion(false);
  };

  // Handle command execution
  const handleCommandExecute = async (command: any) => {
    console.log('Executing command:', command.id);
    await command.action(keybindManagerRef.current?.['getContext']());

    setState(prev => ({
      ...prev,
      timelineEvents: [
        ...prev.timelineEvents,
        {
          id: `command-${Date.now()}`,
          type: 'tab-switch',
          timestamp: new Date(),
          description: `Executed command: ${command.name}`,
          assignmentId: prev.activeAssignment?.id
        }
      ]
    }));
  };

  const handleAssignmentSelect = (assignment: Assignment) => {
    setState(prev => ({
      ...prev,
      activeAssignment: assignment,
      tutorMode: 'TRY_FIRST',
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
      tutorMode: 'HINTS_ONLY',
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

  return (
    <div className="layout" ref={appRef} data-assignment-id={state.activeAssignment?.id}>
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
        <div className="header-shortcuts">
          <small>
            <kbd>Hold Space</kbd> Hints • <kbd>⌘J</kbd> Suggest • <kbd>⌘/</kbd> Commands
          </small>
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

      {/* Keybind Overlays */}
      <HintPopover
        isOpen={showHints}
        hints={hints}
        position={keybindPosition}
        isLoading={hintsLoading}
        onClose={() => setShowHints(false)}
        onHintSelect={handleHintSelect}
      />

      <InlineSuggestion
        isOpen={showInlineSuggestion}
        suggestion={inlineSuggestion}
        position={keybindPosition}
        isLoading={suggestionLoading}
        onAccept={handleSuggestionAccept}
        onReject={() => setShowInlineSuggestion(false)}
        onRequestNew={async () => {
          setSuggestionLoading(true);
          const newSuggestion = await generateSuggestion();
          setInlineSuggestion(newSuggestion);
          setSuggestionLoading(false);
        }}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        commands={defaultCommands}
        onClose={() => setShowCommandPalette(false)}
        onCommandExecute={handleCommandExecute}
      />
    </div>
  );
}

export default App;
