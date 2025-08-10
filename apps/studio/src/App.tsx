import React, { useState, useEffect } from 'react';
import './styles/modern-layout.css';
import AssignmentTray from './components/AssignmentTray';
import WorkArea from './components/WorkArea';
import TutorDock from './components/TutorDock';
import Timeline from './components/Timeline';
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

      <TutorDock
        mode={state.tutorMode}
        activeAssignment={state.activeAssignment}
        submissions={state.submissions}
        onInteraction={handleTutorInteraction}
      />

      <Timeline
        events={state.timelineEvents}
        activeAssignment={state.activeAssignment}
      />
    </div>
  );
}

export default App;
