/**
 * Default commands for the Command Palette
 */

import type { Command } from '../components/CommandPalette';
import type { KeybindContext } from './keybinds';

export const defaultCommands: Command[] = [
  // Editing Commands
  {
    id: 'insert-citation',
    name: 'Insert Citation',
    description: 'Add a citation or reference to your work',
    icon: '📖',
    category: 'editing',
    shortcut: 'Cmd+Shift+C',
    action: async (context?: KeybindContext) => {
      const citation = prompt('Enter citation (e.g., Author, Year):');
      if (citation) {
        document.execCommand('insertText', false, `[${citation}]`);
      }
    }
  },
  {
    id: 'insert-math-equation',
    name: 'Insert Math Equation',
    description: 'Add a mathematical equation or formula',
    icon: '∑',
    category: 'editing',
    shortcut: 'Cmd+Shift+M',
    action: async () => {
      const equation = prompt('Enter equation (LaTeX format):');
      if (equation) {
        document.execCommand('insertText', false, `$$${equation}$$`);
      }
    }
  },
  {
    id: 'clear-content',
    name: 'Clear Content',
    description: 'Clear all content from the current editor',
    icon: '🗑️',
    category: 'editing',
    action: async () => {
      if (confirm('Are you sure you want to clear all content?')) {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLTextAreaElement ||
            activeElement instanceof HTMLInputElement) {
          activeElement.value = '';
        } else if (activeElement?.getAttribute('contenteditable') === 'true') {
          activeElement.textContent = '';
        }
      }
    }
  },

  // AI Commands
  {
    id: 'explain-concept',
    name: 'Explain This Concept',
    description: 'Get an AI explanation of the selected concept',
    icon: '🧠',
    category: 'ai',
    shortcut: 'Cmd+Shift+E',
    action: async (context?: KeybindContext) => {
      if (context?.selectedText) {
        console.log('Requesting explanation for:', context.selectedText);
        // TODO: Integrate with AI service
        alert(`Requesting explanation for: "${context.selectedText}"`);
      } else {
        alert('Please select some text first');
      }
    }
  },
  {
    id: 'get-hints',
    name: 'Get Hints',
    description: 'Request hints for the current problem',
    icon: '💡',
    category: 'ai',
    shortcut: 'Cmd+H',
    action: async () => {
      console.log('Requesting hints...');
      // This would trigger the hint popover
    }
  },
  {
    id: 'check-grammar',
    name: 'Check Grammar & Style',
    description: 'Run grammar and style check on your writing',
    icon: '✍️',
    category: 'ai',
    action: async (context?: KeybindContext) => {
      if (context?.currentContent) {
        console.log('Checking grammar for:', context.currentContent);
        // TODO: Integrate with grammar checking service
        alert('Grammar check feature coming soon!');
      }
    }
  },
  {
    id: 'summarize-text',
    name: 'Summarize Text',
    description: 'Generate a summary of selected text',
    icon: '📝',
    category: 'ai',
    action: async (context?: KeybindContext) => {
      if (context?.selectedText && context.selectedText.length > 50) {
        console.log('Summarizing:', context.selectedText);
        // TODO: Integrate with AI summarization
        alert('Summarization feature coming soon!');
      } else {
        alert('Please select more text to summarize (at least 50 characters)');
      }
    }
  },

  // Export Commands
  {
    id: 'export-pdf',
    name: 'Export to PDF',
    description: 'Export your work as a PDF document',
    icon: '📄',
    category: 'export',
    shortcut: 'Cmd+Shift+P',
    action: async () => {
      console.log('Exporting to PDF...');
      alert('PDF export feature coming soon!');
    }
  },
  {
    id: 'export-annotations',
    name: 'Export Annotations',
    description: 'Export annotations in W3C Web Annotation format',
    icon: '📋',
    category: 'export',
    action: async () => {
      console.log('Exporting annotations...');
      alert('Annotation export feature coming soon!');
    }
  },
  {
    id: 'save-draft',
    name: 'Save Draft',
    description: 'Save current work as a draft',
    icon: '💾',
    category: 'export',
    shortcut: 'Cmd+S',
    action: async () => {
      console.log('Saving draft...');
      // TODO: Implement draft saving
      alert('Draft saved successfully!');
    }
  },

  // Format Commands
  {
    id: 'convert-sketch-svg',
    name: 'Convert Sketch to SVG',
    description: 'Convert hand-drawn sketch to clean SVG shapes',
    icon: '🎨',
    category: 'format',
    action: async () => {
      console.log('Converting sketch to SVG...');
      alert('Sketch-to-SVG conversion coming soon!');
    }
  },
  {
    id: 'format-code',
    name: 'Format Code Block',
    description: 'Format selected text as a code block',
    icon: '💻',
    category: 'format',
    action: async (context?: KeybindContext) => {
      if (context?.selectedText) {
        const formatted = `\`\`\`\n${context.selectedText}\n\`\`\``;
        document.execCommand('insertText', false, formatted);
      }
    }
  },
  {
    id: 'create-list',
    name: 'Create Bullet List',
    description: 'Convert selection to bullet list',
    icon: '•',
    category: 'format',
    action: async (context?: KeybindContext) => {
      if (context?.selectedText) {
        const lines = context.selectedText.split('\n');
        const bulletList = lines.map(line => `• ${line.trim()}`).join('\n');
        document.execCommand('insertText', false, bulletList);
      }
    }
  },

  // Navigation Commands
  {
    id: 'switch-to-doc',
    name: 'Switch to Document Editor',
    description: 'Navigate to the document editor tab',
    icon: '▤',
    category: 'navigation',
    shortcut: 'Cmd+1',
    action: async () => {
      const docTab = document.querySelector('[data-tab="DOC"]') as HTMLElement;
      docTab?.click();
    }
  },
  {
    id: 'switch-to-pdf',
    name: 'Switch to PDF Viewer',
    description: 'Navigate to the PDF annotator tab',
    icon: '▦',
    category: 'navigation',
    shortcut: 'Cmd+2',
    action: async () => {
      const pdfTab = document.querySelector('[data-tab="PDF"]') as HTMLElement;
      pdfTab?.click();
    }
  },
  {
    id: 'switch-to-board',
    name: 'Switch to Whiteboard',
    description: 'Navigate to the digital whiteboard tab',
    icon: '▧',
    category: 'navigation',
    shortcut: 'Cmd+3',
    action: async () => {
      const boardTab = document.querySelector('[data-tab="BOARD"]') as HTMLElement;
      boardTab?.click();
    }
  },
  {
    id: 'toggle-chat',
    name: 'Toggle AI Chat',
    description: 'Show or hide the AI chat panel',
    icon: '💬',
    category: 'navigation',
    shortcut: 'Cmd+K',
    action: async () => {
      const chatToggle = document.querySelector('.chat-widget-toggle') as HTMLElement;
      chatToggle?.click();
    }
  },
  {
    id: 'focus-timeline',
    name: 'Focus Timeline',
    description: 'Jump to the timeline view',
    icon: '📊',
    category: 'navigation',
    action: async () => {
      const timeline = document.querySelector('.timeline') as HTMLElement;
      timeline?.scrollIntoView({ behavior: 'smooth' });
      timeline?.focus();
    }
  }
];

/**
 * Get commands filtered by category
 */
export function getCommandsByCategory(category: Command['category']): Command[] {
  return defaultCommands.filter(cmd => cmd.category === category);
}

/**
 * Find command by ID
 */
export function getCommandById(id: string): Command | undefined {
  return defaultCommands.find(cmd => cmd.id === id);
}

/**
 * Search commands by query
 */
export function searchCommands(query: string): Command[] {
  const lowerQuery = query.toLowerCase();
  return defaultCommands.filter(
    cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery)
  );
}

export default {
  defaultCommands,
  getCommandsByCategory,
  getCommandById,
  searchCommands
};
