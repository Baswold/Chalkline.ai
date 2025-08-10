import React from 'react';
import type { TimelineProps, TimelineEvent } from '../types';

const Timeline: React.FC<TimelineProps> = ({ events, activeAssignment }) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'assignment-opened':
        return '▤';
      case 'submission':
        return '▣';
      case 'hint-given':
        return '○';
      case 'tab-switch':
        return '▷';
      case 'rubric-tick':
        return '●';
      default:
        return '▫';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'assignment-opened':
        return 'blue';
      case 'submission':
        return 'orange';
      case 'hint-given':
        return 'blue';
      case 'tab-switch':
        return 'gray';
      case 'rubric-tick':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatTimeRelative = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const formatTimeExact = (timestamp: Date) => {
    return timestamp.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter events for the active assignment
  const filteredEvents = events.filter(event => 
    !activeAssignment || event.assignmentId === activeAssignment.id
  );

  // Sort events by timestamp (most recent first for display, but show chronologically)
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );

  const getSessionSummary = () => {
    if (!activeAssignment || filteredEvents.length === 0) {
      return null;
    }

    const submissions = filteredEvents.filter(e => e.type === 'submission').length;
    const hints = filteredEvents.filter(e => e.type === 'hint-given').length;
    const startTime = Math.min(...filteredEvents.map(e => e.timestamp.getTime()));
    const sessionDuration = Date.now() - startTime;
    const sessionMinutes = Math.floor(sessionDuration / 60000);

    return {
      submissions,
      hints,
      sessionMinutes: sessionMinutes > 0 ? sessionMinutes : 1
    };
  };

  const sessionSummary = getSessionSummary();

  return (
    <div className="timeline">
      <h4>Session Timeline</h4>
      
      {sessionSummary && (
        <div className="session-summary">
          <div className="summary-stats">
            <span className="stat">
              <strong>{sessionSummary.sessionMinutes}</strong> min
            </span>
            <span className="stat">
              <strong>{sessionSummary.submissions}</strong> submissions
            </span>
            <span className="stat">
              <strong>{sessionSummary.hints}</strong> hints
            </span>
          </div>
        </div>
      )}

      <div className="timeline-items">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => (
            <div
              key={event.id}
              className={`timeline-item ${event.type}`}
              title={`${formatTimeExact(event.timestamp)} - ${event.description}`}
            >
              <div className="timeline-icon">
                {getEventIcon(event.type)}
              </div>
              <div className="timeline-content">
                <div className="timeline-description">
                  {event.description}
                </div>
                <div className="timeline-time">
                  {formatTimeRelative(event.timestamp)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="timeline-empty">
            {activeAssignment ? (
              <div className="empty-state-timeline">
                <span>▣</span>
                <p>Your session timeline will appear here as you work</p>
              </div>
            ) : (
              <div className="empty-state-timeline">
                <span>▤</span>
                <p>Select an assignment to see your progress timeline</p>
              </div>
            )}
          </div>
        )}
      </div>

      {activeAssignment && (
        <div className="timeline-footer">
          <small className="timeline-help">
            Your learning journey is tracked here - submissions, hints, and progress milestones.
          </small>
        </div>
      )}
    </div>
  );
};

export default Timeline;