import React, { useState, useEffect, useRef } from 'react';
import type { KeybindContext } from '../lib/keybinds';

export interface Command {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'editing' | 'navigation' | 'ai' | 'export' | 'format';
  shortcut?: string;
  action: (context?: KeybindContext) => void | Promise<void>;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  commands: Command[];
  context?: KeybindContext;
  onClose: () => void;
  onCommandExecute: (command: Command) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  commands,
  context,
  onClose,
  onCommandExecute
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>(commands);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchQuery, commands]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;

        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          }
          break;

        case 'Escape':
          event.preventDefault();
          handleClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, selectedIndex, filteredCommands]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedIndex(0);
    onClose();
  };

  const handleCommandSelect = (command: Command) => {
    onCommandExecute(command);
    handleClose();
  };

  const getCategoryIcon = (category: Command['category']) => {
    switch (category) {
      case 'editing':
        return '✏️';
      case 'navigation':
        return '🧭';
      case 'ai':
        return '🤖';
      case 'export':
        return '📤';
      case 'format':
        return '🎨';
      default:
        return '⚡';
    }
  };

  const getCategoryColor = (category: Command['category']) => {
    switch (category) {
      case 'editing':
        return '#3b82f6';
      case 'navigation':
        return '#10b981';
      case 'ai':
        return '#8b5cf6';
      case 'export':
        return '#f59e0b';
      case 'format':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={handleClose}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="command-palette-header">
          <input
            ref={inputRef}
            type="text"
            className="command-search"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search commands"
          />
        </div>

        <div className="command-palette-content" ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className="command-empty">
              <p>No commands found matching "{searchQuery}"</p>
              <small>Try a different search term</small>
            </div>
          ) : (
            <div className="command-list" role="listbox">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={`command-item ${
                    index === selectedIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleCommandSelect(command)}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="command-item-icon">
                    {command.icon || getCategoryIcon(command.category)}
                  </div>

                  <div className="command-item-content">
                    <div className="command-item-name">{command.name}</div>
                    <div className="command-item-description">
                      {command.description}
                    </div>
                  </div>

                  <div className="command-item-meta">
                    <span
                      className="command-category"
                      style={{
                        backgroundColor: `${getCategoryColor(command.category)}20`,
                        color: getCategoryColor(command.category)
                      }}
                    >
                      {command.category}
                    </span>
                    {command.shortcut && (
                      <kbd className="command-shortcut">{command.shortcut}</kbd>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-hints">
            <span>
              <kbd>↑↓</kbd> Navigate
            </span>
            <span>
              <kbd>↵</kbd> Execute
            </span>
            <span>
              <kbd>Esc</kbd> Close
            </span>
          </div>
          <div className="command-stats">
            {filteredCommands.length} of {commands.length} commands
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
