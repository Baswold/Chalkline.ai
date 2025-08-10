import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import type { DocEditorProps } from '../types';

const DocEditor: React.FC<DocEditorProps> = ({
  assignment,
  onSubmission,
  submissions
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount.configure({
        limit: 10000,
      }),
    ],
    content: '<p>Start writing your answer here...</p>',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
        spellcheck: 'true',
      },
    },
  });

  // Load existing submission if available
  useEffect(() => {
    if (assignment && editor) {
      const question = assignment.questions[currentQuestion];
      const existingSubmission = submissions.find(s => s.questionId === question);
      
      if (existingSubmission) {
        editor.commands.setContent(existingSubmission.text);
      } else {
        editor.commands.setContent('<p>Start writing your answer here...</p>');
      }
    }
  }, [assignment, currentQuestion, submissions, editor]);

  const handleQuestionChange = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  const handleSubmit = useCallback(async () => {
    if (!assignment || !editor) return;
    
    const question = assignment.questions[currentQuestion];
    const text = editor.getText().trim();
    
    if (text.length < 10) {
      alert('Please write at least 10 characters before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      onSubmission(question, text);
      setIsSubmitting(false);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'submission-success';
      successMessage.textContent = '✅ Answer submitted successfully!';
      successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `;
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
    }, 1000);
  }, [assignment, currentQuestion, editor, onSubmission]);

  const getWordCount = () => {
    if (!editor) return 0;
    return editor.storage.characterCount.words();
  };

  const getCharacterCount = () => {
    if (!editor) return 0;
    return editor.storage.characterCount.characters();
  };

  const isCurrentQuestionAnswered = () => {
    if (!assignment) return false;
    const question = assignment.questions[currentQuestion];
    return submissions.some(s => s.questionId === question);
  };

  if (!assignment) {
    return (
      <div className="doc-editor-empty">
        <div className="empty-state">
          <span>📝</span>
          <h3>No Assignment Selected</h3>
          <p>Choose an assignment from the left panel to begin writing your answers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-editor">

      <div className="current-question">
        <div className="question-header">
          <div className="question-nav-inline">
            <select
              value={currentQuestion}
              onChange={(e) => handleQuestionChange(parseInt(e.target.value))}
              className="question-select-inline"
            >
              {assignment.questions.map((question, index) => (
                <option key={index} value={index}>
                  Question {index + 1}
                </option>
              ))}
            </select>
            {isCurrentQuestionAnswered() && (
              <span className="answered-indicator">✓ Answered</span>
            )}
          </div>
        </div>
        <div className="question-text">
          {assignment.questions[currentQuestion]}
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-toolbar">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={editor?.isActive('bold') ? 'active' : ''}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={editor?.isActive('italic') ? 'active' : ''}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={editor?.isActive('bulletList') ? 'active' : ''}
            title="Bullet List"
          >
            • List
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={editor?.isActive('orderedList') ? 'active' : ''}
            title="Numbered List"
          >
            1. List
          </button>
        </div>

        <div className="editor-content-wrapper">
          <EditorContent editor={editor} />
        </div>

        <div className="editor-footer">
          <div className="editor-stats">
            <span className="word-count">
              {getWordCount()} words
            </span>
            <span className="char-count">
              {getCharacterCount()}/10,000 characters
            </span>
          </div>
          
          <div className="editor-actions">
            <button
              onClick={() => editor?.commands.selectAll()}
              className="editor-action-btn secondary"
            >
              Select All
            </button>
            <button
              onClick={() => {
                editor?.commands.clearContent();
                editor?.commands.focus();
              }}
              className="editor-action-btn secondary"
            >
              Clear
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !editor?.getText().trim()}
              className="editor-action-btn primary submit-btn"
            >
              {isSubmitting ? '⏳ Submitting...' : '📤 Submit Answer'}
            </button>
          </div>
        </div>
      </div>

      <div className="progress-indicator">
        <div className="progress-header">
          <span>Assignment Progress</span>
          <span>{submissions.length}/{assignment.questions.length} questions answered</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              width: `${(submissions.length / assignment.questions.length) * 100}%`
            }}
          />
        </div>
      </div>

      <div className="writing-tips">
        <details>
          <summary>💡 Writing Tips</summary>
          <ul>
            <li>Read the question carefully and address all parts</li>
            <li>Start with an outline or main points</li>
            <li>Support your answers with examples or evidence</li>
            <li>Review your work before submitting</li>
            <li>Use the AI Tutor for hints if you get stuck</li>
          </ul>
        </details>
      </div>
    </div>
  );
};

// Add some basic styles for the success message animation
const styles = document.createElement('style');
styles.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styles);

export default DocEditor;