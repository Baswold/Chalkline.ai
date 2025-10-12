import React, { useState } from 'react';
import TutorDock from './TutorDock';
import type { TutorDockProps } from '../types';

const ChatWidget: React.FC<TutorDockProps> = (props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="chat-widget">
      {open ? (
        <button
          className="chat-widget-close"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
        >
          ×
        </button>
      ) : (
        <button
          className="chat-widget-toggle"
          onClick={() => setOpen(true)}
        >
          AI Chat
        </button>
      )}
      <div
        className="chat-widget-body"
        style={{ display: open ? 'block' : 'none' }}
        aria-hidden={!open}
      >
        <TutorDock {...props} />
      </div>
    </div>
  );
};

export default ChatWidget;
