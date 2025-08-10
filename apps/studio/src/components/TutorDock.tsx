import React, { useState, useRef, useEffect } from 'react';
import type { TutorDockProps, TutorMessage } from '../types';
import { mockHintResponses } from '../data/exampleData';

const TutorDock: React.FC<TutorDockProps> = ({
  mode,
  activeAssignment,
  submissions,
  onInteraction
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Add welcome message when assignment changes
    if (activeAssignment && messages.length === 0) {
      const welcomeMessage: TutorMessage = {
        id: `welcome-${Date.now()}`,
        type: 'assistant',
        content: `Welcome! I'm here to help you with "${activeAssignment.title}". Remember, I'll provide guidance and hints rather than direct answers. Let's work through this together!`,
        timestamp: new Date(),
        mode: 'NORM_CHAT'
      };
      setMessages([welcomeMessage]);
    }
  }, [activeAssignment]);

  const getModeDisplay = () => {
    switch (mode) {
      case 'TRY_FIRST':
        return {
          className: 'try-first',
          text: '🤔 Please attempt the problem first, then I can provide hints!',
          description: 'Make your best effort at solving the problem before asking for help.'
        };
      case 'HINTS_ONLY':
        return {
          className: 'hints-only',
          text: '💡 Great! Now I can provide hints and guidance.',
          description: 'I can offer hints, explanations, and point you toward resources.'
        };
      case 'NORM_CHAT':
        return {
          className: 'normal-chat',
          text: '💬 Ask me anything about the topic!',
          description: 'Feel free to ask general questions not directly related to the assignment.'
        };
    }
  };

  const generateMockResponse = (userMessage: string): string => {
    if (!activeAssignment) {
      return "Hi there! Please select an assignment first, and I'll be happy to help you with it.";
    }

    if (mode === 'TRY_FIRST') {
      return "I'd love to help, but I need to see your attempt at the problem first. Please share what you've tried so far, and then I can provide targeted hints to guide you toward the solution.";
    }

    // Simple keyword-based response selection
    const subject = activeAssignment.subject.toLowerCase();
    let responses: string[] = [];

    if (subject.includes('math')) {
      responses = mockHintResponses.quadratic;
    } else if (subject.includes('history')) {
      responses = mockHintResponses['civil-war'];
    } else if (subject.includes('chemistry')) {
      responses = mockHintResponses.chemistry;
    } else {
      responses = [
        "That's a great question! Let me help you think through this step by step.",
        "I can see you're working hard on this. What part would you like me to clarify?",
        "Good thinking! What do you think the next step might be?"
      ];
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: TutorMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      mode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const assistantResponse: TutorMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: generateMockResponse(inputValue.trim()),
        timestamp: new Date(),
        mode
      };

      setMessages(prev => [...prev, assistantResponse]);
      setIsLoading(false);
      onInteraction(inputValue.trim());
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const modeDisplay = getModeDisplay();

  return (
    <div className="tutor-dock">
      <div className="tutor-header">
        <span>🤖 AI Tutor</span>
        {activeAssignment && (
          <small> - {activeAssignment.subject}</small>
        )}
      </div>

      <div className={`tutor-mode-banner ${modeDisplay.className}`}>
        <div className="mode-text">{modeDisplay.text}</div>
        <small className="mode-description">{modeDisplay.description}</small>
      </div>

      <div className="tutor-content">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type} ${message.mode.toLowerCase()}`}
          >
            <div className="message-header">
              <span className="message-author">
                {message.type === 'user' ? '👤 You' : '🤖 AI Tutor'}
              </span>
              <span className="message-time">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
            <div className="message-content">
              {message.content}
            </div>
            {message.mode !== 'NORM_CHAT' && (
              <div className="message-mode-indicator">
                Mode: {message.mode.replace('_', ' ')}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-header">
              <span className="message-author">🤖 AI Tutor</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              Thinking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="tutor-input">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={
            mode === 'TRY_FIRST' 
              ? "First, share your attempt at solving the problem..."
              : mode === 'HINTS_ONLY'
              ? "Ask for hints or clarification..."
              : "Ask me anything about this topic..."
          }
          disabled={isLoading}
          aria-label="Type your message to the AI tutor"
        />
        <button
          className="tutor-send"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
        >
          {isLoading ? '⏳' : '📤'} Send
        </button>
        
        <div className="tutor-hints">
          <small>
            💡 <strong>Tip:</strong> I provide better help when you show your work first!
          </small>
        </div>
      </div>
    </div>
  );
};

export default TutorDock;