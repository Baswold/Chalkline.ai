import React from 'react';
import type { AssignmentTrayProps } from '../types';

const AssignmentTray: React.FC<AssignmentTrayProps> = ({
  assignments,
  activeAssignment,
  onAssignmentSelect
}) => {
  const formatDueDate = (date?: Date) => {
    if (!date) return null;
    
    const now = new Date();
    const timeDiff = date.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      return <span className="assignment-due overdue">Overdue</span>;
    } else if (daysDiff === 0) {
      return <span className="assignment-due today">Due Today</span>;
    } else if (daysDiff === 1) {
      return <span className="assignment-due tomorrow">Due Tomorrow</span>;
    } else if (daysDiff <= 7) {
      return <span className="assignment-due this-week">Due in {daysDiff} days</span>;
    } else {
      return <span className="assignment-due">Due {date.toLocaleDateString()}</span>;
    }
  };

  const getProgressText = (assignment: any) => {
    // This would typically come from submission data
    // For now, we'll simulate some progress
    const questionCount = assignment.questions.length;
    const completed = Math.floor(Math.random() * questionCount);
    
    if (completed === 0) {
      return 'Not started';
    } else if (completed === questionCount) {
      return 'Completed';
    } else {
      return `${completed}/${questionCount} questions`;
    }
  };

  return (
    <div className="assignment-tray">
      <h3>Assignments</h3>
      <ul className="assignment-list">
        {assignments.map((assignment) => (
          <li
            key={assignment.id}
            className={`assignment-item ${
              activeAssignment?.id === assignment.id ? 'active' : ''
            }`}
            onClick={() => onAssignmentSelect(assignment)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAssignmentSelect(assignment);
              }
            }}
          >
            <div className="assignment-title">{assignment.title}</div>
            <div className="assignment-subject">{assignment.subject}</div>
            {formatDueDate(assignment.dueDate)}
            <div className="assignment-progress">
              {getProgressText(assignment)}
            </div>
            {assignment.description && (
              <div className="assignment-description" title={assignment.description}>
                {assignment.description.length > 80 
                  ? assignment.description.substring(0, 80) + '...' 
                  : assignment.description
                }
              </div>
            )}
          </li>
        ))}
      </ul>
      
      {assignments.length === 0 && (
        <div className="empty-state">
          <p>No assignments available</p>
          <small>Check back later or contact your teacher.</small>
        </div>
      )}
    </div>
  );
};

export default AssignmentTray;