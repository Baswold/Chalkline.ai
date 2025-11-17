import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields (unless explicitly allowed)
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const metaMatches = shortcut.meta ? event.metaKey : true;
      const shiftMatches = shortcut.shift ? event.shiftKey : true;
      const altMatches = shortcut.alt ? event.altKey : true;

      // Special handling for global shortcuts that should work in input fields
      const isGlobalShortcut = shortcut.key === 'j' || shortcut.key === '/';

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        // If we're in an input field and this isn't a global shortcut, skip it
        if (isInputField && !isGlobalShortcut) {
          continue;
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }

        shortcut.action();
        break; // Only trigger one shortcut
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined common shortcut combinations
export const Shortcuts = {
  // AI and command palette
  OPEN_AI_CHAT: (action: () => void): KeyboardShortcut => ({
    key: 'j',
    meta: true,
    ctrl: true,
    description: 'Open AI Chat (Cmd/Ctrl+J)',
    action,
    preventDefault: true
  }),

  COMMAND_PALETTE: (action: () => void): KeyboardShortcut => ({
    key: '/',
    meta: true,
    ctrl: true,
    description: 'Open Command Palette (Cmd/Ctrl+/)',
    action,
    preventDefault: true
  }),

  // Document editing
  SAVE: (action: () => void): KeyboardShortcut => ({
    key: 's',
    meta: true,
    ctrl: true,
    description: 'Save (Cmd/Ctrl+S)',
    action,
    preventDefault: true
  }),

  UNDO: (action: () => void): KeyboardShortcut => ({
    key: 'z',
    meta: true,
    ctrl: true,
    description: 'Undo (Cmd/Ctrl+Z)',
    action,
    preventDefault: true
  }),

  REDO: (action: () => void): KeyboardShortcut => ({
    key: 'z',
    meta: true,
    ctrl: true,
    shift: true,
    description: 'Redo (Cmd/Ctrl+Shift+Z)',
    action,
    preventDefault: true
  }),

  // Navigation
  ESCAPE: (action: () => void): KeyboardShortcut => ({
    key: 'Escape',
    description: 'Close/Cancel (Esc)',
    action,
    preventDefault: false
  }),

  // Tab switching
  TAB_1: (action: () => void): KeyboardShortcut => ({
    key: '1',
    meta: true,
    ctrl: true,
    description: 'Switch to Document tab (Cmd/Ctrl+1)',
    action,
    preventDefault: true
  }),

  TAB_2: (action: () => void): KeyboardShortcut => ({
    key: '2',
    meta: true,
    ctrl: true,
    description: 'Switch to PDF tab (Cmd/Ctrl+2)',
    action,
    preventDefault: true
  }),

  TAB_3: (action: () => void): KeyboardShortcut => ({
    key: '3',
    meta: true,
    ctrl: true,
    description: 'Switch to Whiteboard tab (Cmd/Ctrl+3)',
    action,
    preventDefault: true
  }),

  // Help
  HELP: (action: () => void): KeyboardShortcut => ({
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts (Shift+?)',
    action,
    preventDefault: true
  })
};
