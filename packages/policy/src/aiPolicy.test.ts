import { describe, it, expect } from 'vitest';
import {
  decideResponseMode,
  hasGenuineAttempt,
  makeResponseDecision,
  DEFAULT_HINT_POLICY,
  type Assignment,
  type Submission
} from './aiPolicy';

describe('decideResponseMode', () => {
  const assignment: Assignment = {
    id: 'math-1',
    title: 'Algebra Basics',
    questions: ['What is 2 + 2?']
  };

  it('falls back to normal chat when no assignment provided', () => {
    expect(decideResponseMode('hello', null, null)).toBe('NORM_CHAT');
  });

  it('requires a first attempt when the question matches and there are no submissions', () => {
    expect(decideResponseMode('What is 2 + 2?', assignment, null)).toBe('TRY_FIRST');
  });

  it('moves to hints once a submission with attempts exists', () => {
    const submission: Submission = {
      questionId: 'q1',
      text: 'I think it is 3',
      attempts: 1,
      timestamp: new Date()
    };

    expect(decideResponseMode('2 + 2', assignment, submission)).toBe('HINTS_ONLY');
  });
});

describe('hasGenuineAttempt', () => {
  it('flags short or empty answers as not genuine attempts', () => {
    const submission: Submission = {
      questionId: 'q1',
      text: 'idk',
      attempts: 1,
      timestamp: new Date()
    };

    expect(hasGenuineAttempt(submission)).toBe(false);
  });

  it('accepts thoughtful responses as genuine attempts', () => {
    const submission: Submission = {
      questionId: 'q1',
      text: 'I tried factoring but got stuck after expanding the terms.',
      attempts: 1,
      timestamp: new Date()
    };

    expect(hasGenuineAttempt(submission)).toBe(true);
  });
});

describe('makeResponseDecision', () => {
  const baseContext = {
    assignment: {
      id: 'math-1',
      title: 'Algebra Basics',
      questions: ['Solve 2 + 2']
    } as Assignment,
    submission: {
      questionId: 'q1',
      text: 'My answer is 4 because 2 plus 2 equals 4.',
      attempts: 1,
      timestamp: new Date()
    } as Submission,
    userMessage: 'Solve 2 + 2',
    sessionHints: 0,
    timeSpentOnTask: 1000,
    previousSubmissions: []
  };

  it('recommends normal chat when the query is unrelated', () => {
    const decision = makeResponseDecision({
      ...baseContext,
      userMessage: 'How is the weather today?'
    });

    expect(decision.mode).toBe('NORM_CHAT');
    expect(decision.allowHints).toBe(false);
  });

  it('limits hints when the session allowance is exceeded', () => {
    const decision = makeResponseDecision({
      ...baseContext,
      sessionHints: DEFAULT_HINT_POLICY.maxHintsPerSession
    });

    expect(decision.mode).toBe('HINTS_ONLY');
    expect(decision.allowHints).toBe(false);
  });
});
