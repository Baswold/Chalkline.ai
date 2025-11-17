import React, { useState, useEffect, useRef } from 'react';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  category?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.category?.toLowerCase().includes(searchLower)
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-palette-header">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="command-palette-input"
          />
          <span className="command-palette-hint">↑↓ Navigate · Enter Select · Esc Close</span>
        </div>

        <div className="command-palette-results" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              No commands found for "{search}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="command-category">
                <div className="command-category-label">{category}</div>
                {cmds.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  return (
                    <div
                      key={cmd.id}
                      className={`command-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="command-item-main">
                        {cmd.icon && <span className="command-icon">{cmd.icon}</span>}
                        <div className="command-details">
                          <div className="command-label">{cmd.label}</div>
                          {cmd.description && (
                            <div className="command-description">{cmd.description}</div>
                          )}
                        </div>
                      </div>
                      {cmd.shortcut && (
                        <div className="command-shortcut">{cmd.shortcut}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-palette-stats">
            {filteredCommands.length} {filteredCommands.length === 1 ? 'command' : 'commands'}
          </div>
        </div>
      </div>

      <style>{`
        .command-palette-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 2000;
          padding-top: 15vh;
          backdrop-filter: blur(2px);
        }

        .command-palette {
          width: 90%;
          max-width: 600px;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          max-height: 60vh;
          overflow: hidden;
          animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .command-palette-header {
          padding: var(--space-md);
          border-bottom: 1px solid var(--gray-200);
        }

        .command-palette-input {
          width: 100%;
          padding: var(--space-sm);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: var(--text-lg);
          font-family: inherit;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .command-palette-input:focus {
          border-color: var(--blue-500);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .command-palette-hint {
          display: block;
          margin-top: var(--space-xs);
          font-size: var(--text-xs);
          color: var(--gray-500);
        }

        .command-palette-results {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-xs);
        }

        .command-palette-empty {
          padding: var(--space-xl);
          text-align: center;
          color: var(--gray-500);
        }

        .command-category {
          margin-bottom: var(--space-md);
        }

        .command-category-label {
          padding: var(--space-xs) var(--space-sm);
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .command-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .command-item:hover,
        .command-item.selected {
          background: var(--blue-50);
        }

        .command-item-main {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex: 1;
          min-width: 0;
        }

        .command-icon {
          font-size: var(--text-lg);
          flex-shrink: 0;
        }

        .command-details {
          min-width: 0;
          flex: 1;
        }

        .command-label {
          font-size: var(--text-base);
          color: var(--gray-800);
          font-weight: 500;
        }

        .command-description {
          font-size: var(--text-sm);
          color: var(--gray-600);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .command-shortcut {
          font-size: var(--text-xs);
          color: var(--gray-500);
          padding: 2px 6px;
          background: var(--gray-100);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          font-family: monospace;
          flex-shrink: 0;
          margin-left: var(--space-sm);
        }

        .command-palette-footer {
          padding: var(--space-sm) var(--space-md);
          border-top: 1px solid var(--gray-200);
          background: var(--gray-50);
        }

        .command-palette-stats {
          font-size: var(--text-xs);
          color: var(--gray-600);
        }
      `}</style>
    </div>
  );
};

export default CommandPalette;
