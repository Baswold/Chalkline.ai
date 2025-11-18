/**
 * Keybinds system for Chalkline.AI Studio
 *
 * Provides keyboard shortcuts for:
 * - Hold Space (≥500ms): Open hints popover
 * - Cmd/Ctrl+J: Insert inline AI suggestion
 * - Cmd/Ctrl+/: Open command palette
 * - Escape: Close all popovers
 */

export interface KeybindContext {
  cursorPosition?: number;
  selectedText?: string;
  currentContent?: string;
  assignmentId?: string;
  submissionId?: string;
}

export type KeybindEvent =
  | { type: 'hint-request'; context: KeybindContext }
  | { type: 'inline-suggestion'; context: KeybindContext }
  | { type: 'command-palette'; context: KeybindContext }
  | { type: 'escape'; context: KeybindContext };

export type KeybindHandler = (event: KeybindEvent) => void;

export class KeybindManager {
  private spaceDownAt: number | null = null;
  private handler: KeybindHandler;
  private rootElement: HTMLElement;
  private holdThreshold = 500; // milliseconds
  private isEnabled = true;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;

  constructor(rootElement: HTMLElement, handler: KeybindHandler) {
    this.rootElement = rootElement;
    this.handler = handler;

    // Bind methods to preserve 'this' context
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }

  /**
   * Start listening for keyboard events
   */
  public start(): void {
    this.rootElement.addEventListener('keydown', this.boundHandleKeyDown);
    this.rootElement.addEventListener('keyup', this.boundHandleKeyUp);
  }

  /**
   * Stop listening for keyboard events
   */
  public stop(): void {
    this.rootElement.removeEventListener('keydown', this.boundHandleKeyDown);
    this.rootElement.removeEventListener('keyup', this.boundHandleKeyUp);
  }

  /**
   * Enable or disable keybinds
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get current context from the active element
   */
  private getContext(): KeybindContext {
    const activeElement = document.activeElement;
    const context: KeybindContext = {};

    if (activeElement && (activeElement instanceof HTMLTextAreaElement ||
                          activeElement instanceof HTMLInputElement ||
                          activeElement.getAttribute('contenteditable') === 'true')) {

      // Get selection info
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        context.selectedText = selection.toString();
        const range = selection.getRangeAt(0);
        context.cursorPosition = range.startOffset;
      }

      // Get current content
      if (activeElement instanceof HTMLTextAreaElement ||
          activeElement instanceof HTMLInputElement) {
        context.currentContent = activeElement.value;
        context.cursorPosition = activeElement.selectionStart || 0;
        context.selectedText = activeElement.value.substring(
          activeElement.selectionStart || 0,
          activeElement.selectionEnd || 0
        );
      } else if (activeElement.getAttribute('contenteditable') === 'true') {
        context.currentContent = activeElement.textContent || '';
      }
    }

    // Get assignment context from data attributes
    const workArea = document.querySelector('[data-assignment-id]');
    if (workArea) {
      context.assignmentId = workArea.getAttribute('data-assignment-id') || undefined;
    }

    return context;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const target = event.target as HTMLElement;
    const isInEditableField = target instanceof HTMLTextAreaElement ||
                              target instanceof HTMLInputElement ||
                              target.getAttribute('contenteditable') === 'true';

    // Hold Space for hints
    if (event.code === 'Space' && !event.repeat && isInEditableField) {
      if (!this.spaceDownAt) {
        this.spaceDownAt = Date.now();
      }
    }

    // Cmd/Ctrl+J for inline suggestions
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
      event.preventDefault();
      this.handler({
        type: 'inline-suggestion',
        context: this.getContext()
      });
      return;
    }

    // Cmd/Ctrl+/ for command palette
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      this.handler({
        type: 'command-palette',
        context: this.getContext()
      });
      return;
    }

    // Escape to close popovers
    if (event.key === 'Escape') {
      this.handler({
        type: 'escape',
        context: this.getContext()
      });
      return;
    }
  }

  /**
   * Handle keyup events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Check if Space was held long enough
    if (event.code === 'Space' && this.spaceDownAt) {
      const heldDuration = Date.now() - this.spaceDownAt;

      if (heldDuration >= this.holdThreshold) {
        event.preventDefault();
        this.handler({
          type: 'hint-request',
          context: this.getContext()
        });
      }

      this.spaceDownAt = null;
    }
  }

  /**
   * Update the hold threshold for space key
   */
  public setHoldThreshold(ms: number): void {
    this.holdThreshold = ms;
  }
}

/**
 * Create and install keybinds on an element
 */
export function installKeybinds(
  rootElement: HTMLElement,
  handler: KeybindHandler
): KeybindManager {
  const manager = new KeybindManager(rootElement, handler);
  manager.start();
  return manager;
}

/**
 * Default keybind handler that logs events (for development)
 */
export function createDefaultHandler(): KeybindHandler {
  return (event: KeybindEvent) => {
    console.log('[Keybind]', event.type, event.context);
  };
}

export default {
  KeybindManager,
  installKeybinds,
  createDefaultHandler
};
