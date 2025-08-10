import { z } from 'zod';

// Core types for the AI policy system
export const AssignmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  questions: z.array(z.string()),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  subject: z.string().optional()
});

export const SubmissionSchema = z.object({
  questionId: z.string(),
  text: z.string(),
  attempts: z.number(),
  timestamp: z.date(),
  wordCount: z.number().optional(),
  timeSpent: z.number().optional() // in milliseconds
});

export type Assignment = z.infer<typeof AssignmentSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;

// Response modes for the AI system
export type ResponseMode = "NORM_CHAT" | "TRY_FIRST" | "HINTS_ONLY";

/**
 * Core policy engine that determines how the AI should respond to student queries
 * Based on assignment context and submission history
 */
export function decideResponseMode(
  userMsg: string,
  assignment: Assignment | null,
  submission: Submission | null
): ResponseMode {
  // If no assignment context, allow normal chat
  if (!assignment) {
    return "NORM_CHAT";
  }

  // Check if the user message relates to the current assignment
  const msgLower = userMsg.toLowerCase();
  const isOnAssignment = assignment.questions.some(question => 
    msgLower.includes(question.toLowerCase()) ||
    question.toLowerCase().includes(msgLower)
  );

  // If not about the assignment, allow normal chat
  if (!isOnAssignment) {
    return "NORM_CHAT";
  }

  // If no submission or no attempts yet, require student to try first
  if (!submission || submission.attempts === 0) {
    return "TRY_FIRST";
  }

  // Student has attempted, now provide hints only
  return "HINTS_ONLY";
}

/**
 * Checks if a user message is asking for direct answers
 */
export function isAskingForAnswer(userMsg: string): boolean {
  const answerPatterns = [
    /\b(answer|solve|what's.*answer|final.*answer|solution)\b/i,
    /\b(tell me the|give me the|show me the).*answer\b/i,
    /\b(what is|what are).*answer/i,
    /\bhow to (solve|do) this/i
  ];
  
  return answerPatterns.some(pattern => pattern.test(userMsg));
}

/**
 * Analyzes submission quality to determine if student has made genuine attempt
 */
export function hasGenuineAttempt(submission: Submission): boolean {
  if (!submission.text || submission.text.trim().length < 10) {
    return false;
  }
  
  // Check for obvious placeholder text
  const placeholders = [
    'i don\'t know',
    'help me',
    'please solve',
    'give me the answer',
    'idk',
    'no idea'
  ];
  
  const textLower = submission.text.toLowerCase();
  return !placeholders.some(placeholder => textLower.includes(placeholder));
}

/**
 * Policy for handling hints - provides structured guidance without full answers
 */
export interface HintPolicy {
  maxHintsPerSession: number;
  hintsGiven: number;
  allowLeadingQuestions: boolean;
  allowWorkedExamples: boolean;
  allowResourceLinks: boolean;
}

export const DEFAULT_HINT_POLICY: HintPolicy = {
  maxHintsPerSession: 3,
  hintsGiven: 0,
  allowLeadingQuestions: true,
  allowWorkedExamples: false, // Only after multiple attempts
  allowResourceLinks: true
};

/**
 * Context information for policy decisions
 */
export interface PolicyContext {
  assignment: Assignment | null;
  submission: Submission | null;
  userMessage: string;
  sessionHints: number;
  timeSpentOnTask: number; // milliseconds
  previousSubmissions: Submission[];
}

/**
 * Enhanced policy engine with context awareness
 */
export function makeResponseDecision(context: PolicyContext): {
  mode: ResponseMode;
  reasoning: string;
  allowHints: boolean;
  suggestedAction?: string;
} {
  const { assignment, submission, userMessage, sessionHints, previousSubmissions } = context;
  
  const mode = decideResponseMode(userMessage, assignment, submission);
  
  switch (mode) {
    case "NORM_CHAT":
      return {
        mode,
        reasoning: "Query not related to current assignment",
        allowHints: false
      };
      
    case "TRY_FIRST":
      return {
        mode,
        reasoning: "Student has not attempted the assignment yet",
        allowHints: false,
        suggestedAction: "Please make your first attempt at the problem before I can provide hints."
      };
      
    case "HINTS_ONLY":
      const hasGoodAttempt = submission && hasGenuineAttempt(submission);
      const isAskingAnswer = isAskingForAnswer(userMessage);
      
      if (!hasGoodAttempt) {
        return {
          mode: "TRY_FIRST",
          reasoning: "Student attempt appears insufficient",
          allowHints: false,
          suggestedAction: "Please provide a more detailed attempt showing your thinking."
        };
      }
      
      if (sessionHints >= DEFAULT_HINT_POLICY.maxHintsPerSession) {
        return {
          mode: "HINTS_ONLY",
          reasoning: "Maximum hints reached for this session",
          allowHints: false,
          suggestedAction: "You've received the maximum hints for this session. Try working with what you have or ask your teacher for additional help."
        };
      }
      
      return {
        mode,
        reasoning: "Student has made genuine attempt, providing guided hints",
        allowHints: true
      };
      
    default:
      return {
        mode: "NORM_CHAT",
        reasoning: "Fallback to normal chat",
        allowHints: false
      };
  }
}

export default {
  decideResponseMode,
  makeResponseDecision,
  isAskingForAnswer,
  hasGenuineAttempt,
  AssignmentSchema,
  SubmissionSchema,
  DEFAULT_HINT_POLICY
};