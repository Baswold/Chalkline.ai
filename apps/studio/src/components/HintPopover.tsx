import React, { useEffect, useRef } from 'react';
import type { KeybindContext } from '../lib/keybinds';

export interface Hint {
  id: string;
  text: string;
  type: 'concept' | 'method' | 'resource' | 'leading-question';
  confidence?: number;
}

export interface HintPopoverProps {
  isOpen: boolean;
  hints: Hint[];
  position?: { x: number; y: number };
  context?: KeybindContext;
  onClose: () => void;
  onHintSelect: (hint: Hint) => void;
  isLoading?: boolean;
}

const HintPopover: React.FC<HintPopoverProps> = ({
  isOpen,
  hints,
  position,
  context,
  onClose,
  onHintSelect,
  isLoading = false
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getHintIcon = (type: Hint['type']) => {
    switch (type) {
      case 'concept':
        return '💡';
      case 'method':
        return '🔧';
      case 'resource':
        return '📚';
      case 'leading-question':
        return '❓';
      default:
        return '💬';
    }
  };

  const getHintTypeLabel = (type: Hint['type']) => {
    switch (type) {
      case 'concept':
        return 'Concept Hint';
      case 'method':
        return 'Method Suggestion';
      case 'resource':
        return 'Resource';
      case 'leading-question':
        return 'Guiding Question';
      default:
        return 'Hint';
    }
  };

  return (
    <div
      ref={popoverRef}
      className="hint-popover"
      style={{
        position: 'fixed',
        left: position?.x || '50%',
        top: position?.y || '50%',
        transform: position ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
        zIndex: 1000
      }}
      role="dialog"
      aria-label="Hints popover"
    >
      <div className="hint-popover-header">
        <h4>💡 AI Hints</h4>
        <button
          onClick={onClose}
          className="hint-popover-close"
          aria-label="Close hints"
        >
          ✕
        </button>
      </div>

      <div className="hint-popover-content">
        {isLoading ? (
          <div className="hint-loading">
            <div className="spinner"></div>
            <p>Generating helpful hints...</p>
          </div>
        ) : hints.length === 0 ? (
          <div className="hint-empty">
            <p>No hints available right now.</p>
            <small>Try making an attempt first, then ask for help!</small>
          </div>
        ) : (
          <div className="hint-list">
            {hints.map((hint) => (
              <button
                key={hint.id}
                className="hint-item"
                onClick={() => onHintSelect(hint)}
                role="option"
                aria-selected={false}
              >
                <div className="hint-item-icon">
                  {getHintIcon(hint.type)}
                </div>
                <div className="hint-item-content">
                  <div className="hint-item-type">
                    {getHintTypeLabel(hint.type)}
                  </div>
                  <div className="hint-item-text">
                    {hint.text}
                  </div>
                  {hint.confidence && (
                    <div className="hint-item-confidence">
                      Confidence: {Math.round(hint.confidence * 100)}%
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {context?.selectedText && (
        <div className="hint-popover-footer">
          <small>
            Context: "{context.selectedText.substring(0, 50)}
            {context.selectedText.length > 50 ? '...' : ''}"
          </small>
        </div>
      )}

      <div className="hint-popover-tips">
        <small>
          <strong>Tip:</strong> Press <kbd>Esc</kbd> to close
        </small>
      </div>
    </div>
  );
};

export default HintPopover;
