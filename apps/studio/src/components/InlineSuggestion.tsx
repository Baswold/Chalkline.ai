import React, { useState, useEffect } from 'react';
import type { KeybindContext } from '../lib/keybinds';

export interface Suggestion {
  id: string;
  text: string;
  confidence: number;
  reasoning?: string;
}

export interface InlineSuggestionProps {
  isOpen: boolean;
  suggestion: Suggestion | null;
  position?: { x: number; y: number };
  context?: KeybindContext;
  onAccept: (suggestion: Suggestion) => void;
  onReject: () => void;
  onRequestNew: () => void;
  isLoading?: boolean;
}

const InlineSuggestion: React.FC<InlineSuggestionProps> = ({
  isOpen,
  suggestion,
  position,
  context,
  onAccept,
  onReject,
  onRequestNew,
  isLoading = false
}) => {
  const [ghostText, setGhostText] = useState('');

  useEffect(() => {
    if (suggestion) {
      setGhostText(suggestion.text);
    }
  }, [suggestion]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen || !suggestion) return;

      // Tab to accept
      if (event.key === 'Tab') {
        event.preventDefault();
        onAccept(suggestion);
      }

      // Escape to reject
      if (event.key === 'Escape') {
        event.preventDefault();
        onReject();
      }

      // Cmd/Ctrl + Enter for new suggestion
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        onRequestNew();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, suggestion, onAccept, onReject, onRequestNew]);

  if (!isOpen) return null;

  return (
    <div
      className="inline-suggestion"
      style={{
        position: 'fixed',
        left: position?.x || '50%',
        top: position?.y || '50%',
        transform: 'translateX(-50%)',
        zIndex: 999
      }}
    >
      {isLoading ? (
        <div className="inline-suggestion-loading">
          <div className="spinner-small"></div>
          <span>Generating suggestion...</span>
        </div>
      ) : suggestion ? (
        <div className="inline-suggestion-content">
          <div className="inline-suggestion-ghost">
            <span className="ghost-text">{ghostText}</span>
            {suggestion.confidence && (
              <span className="confidence-badge">
                {Math.round(suggestion.confidence * 100)}%
              </span>
            )}
          </div>

          {suggestion.reasoning && (
            <div className="inline-suggestion-reasoning">
              <small>{suggestion.reasoning}</small>
            </div>
          )}

          <div className="inline-suggestion-actions">
            <button
              onClick={() => onAccept(suggestion)}
              className="suggestion-btn accept"
              title="Accept suggestion (Tab)"
            >
              <kbd>Tab</kbd> Accept
            </button>
            <button
              onClick={onRequestNew}
              className="suggestion-btn refresh"
              title="Request new suggestion (Cmd/Ctrl+Enter)"
            >
              <kbd>⌘↵</kbd> New
            </button>
            <button
              onClick={onReject}
              className="suggestion-btn reject"
              title="Reject (Esc)"
            >
              <kbd>Esc</kbd> Reject
            </button>
          </div>

          {context?.currentContent && (
            <div className="inline-suggestion-preview">
              <div className="preview-label">Preview:</div>
              <div className="preview-text">
                {context.currentContent.substring(0, context.cursorPosition || 0)}
                <span className="preview-insertion">{suggestion.text}</span>
                {context.currentContent.substring(context.cursorPosition || 0)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="inline-suggestion-empty">
          <p>No suggestion available</p>
          <button onClick={onRequestNew} className="suggestion-btn">
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

export default InlineSuggestion;
