import React, { useState } from 'react';
import TutorDock from './TutorDock';
import type { TutorDockProps } from '../types';

const ChatWidget: React.FC<TutorDockProps> = (props) => {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        className="chat-widget-toggle"
        onClick={() => setOpen(true)}
      >
        AI Chat
      </button>
    );
  }

  return (
    <div className="chat-widget">
      <button
        className="chat-widget-close"
        onClick={() => setOpen(false)}
        aria-label="Close chat"
      >
        ×
      </button>
      <TutorDock {...props} />
    </div>
  );
};

export default ChatWidget;
