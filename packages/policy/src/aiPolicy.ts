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
    /\bhow to (solve|do) this/i,
    /\b(just|simply) (tell|give|show) me\b/i,
    /\b(write|do|complete) (it|this|that) for me\b/i,
    /\bstep[- ]by[- ]step solution\b/i,
    /\b(entire|whole|complete) answer\b/i,
    /\b(quick|fast|easy) (way|answer|solution)\b/i
  ];

  return answerPatterns.some(pattern => pattern.test(userMsg));
}

/**
 * Checks if a user message is attempting to bypass the AI policy
 */
export function isPolicyBypassAttempt(userMsg: string): boolean {
  const bypassPatterns = [
    /ignore (all |previous )?(instructions|prompts|rules|policies)/i,
    /you are (now |a )?(different|new|unrestricted)/i,
    /forget (everything|all|your training)/i,
    /act as (if |though )?you (are|were|had)/i,
    /roleplay|pretend (you are|to be)/i,
    /disregard (your|the) (training|instructions|guidelines)/i,
    /override (your|the) (settings|restrictions)/i,
    /(jailbreak|DAN|do anything now)/i,
    /this is (just|only) (a|an) (test|exam|exercise) so/i,
    /system (prompt|message|instruction)/i
  ];

  return bypassPatterns.some(pattern => pattern.test(userMsg));
}

/**
 * Analyzes the sophistication and intent of the question
 */
export interface QuestionAnalysis {
  isSeekingUnderstanding: boolean;
  isSurplusKnowledge: boolean;
  showsWorkInProgress: boolean;
  isSpecificQuestion: boolean;
  overallScore: number; // 0-1, higher means more genuine learning intent
}

export function analyzeQuestionIntent(userMsg: string, submission: Submission | null): QuestionAnalysis {
  let score = 0.5; // Start neutral

  // Positive indicators: Seeking understanding
  const understandingPatterns = [
    /\b(why|how come|what makes|what causes)\b/i,
    /\b(understand|clarify|explain|elaborate)\b/i,
    /\b(confused|unclear|unsure) (about|on)\b/i,
    /\b(difference between|compare)\b/i,
    /\b(in other words|put differently)\b/i,
    /\b(means|meaning|definition)\b/i
  ];

  const isSeekingUnderstanding = understandingPatterns.some(p => p.test(userMsg));
  if (isSeekingUnderstanding) score += 0.2;

  // Positive: Shows work in progress
  const workIndicators = [
    /\b(I tried|I attempted|I think|my approach)\b/i,
    /\b(so far|up to now|until now)\b/i,
    /\b(this is what I (did|have))\b/i,
    /\b(my (answer|solution|work) is)\b/i,
    /\b(got|reached|ended up with)\b/i
  ];

  const showsWorkInProgress = submission !== null || workIndicators.some(p => p.test(userMsg));
  if (showsWorkInProgress) score += 0.2;

  // Positive: Specific question about a concept
  const specificIndicators = [
    /\b(step|part|section|line) \d+\b/i,
    /\b(this|that|the) (equation|formula|concept|method)\b/i,
    /\b(specifically|particularly)\b/i
  ];

  const isSpecificQuestion = specificIndicators.some(p => p.test(userMsg));
  if (isSpecificQuestion) score += 0.15;

  // Negative indicators: Seeking shortcuts
  const shortcutPatterns = [
    /\b(quick|fast|easy|simple) (way|answer|solution)\b/i,
    /\b(shortcut|cheat|hack)\b/i,
    /\b(without (doing|showing|explaining))\b/i
  ];

  if (shortcutPatterns.some(p => p.test(userMsg))) score -= 0.2;

  // Negative: Vague or minimal effort questions
  if (userMsg.length < 20) score -= 0.1;
  if (/^\s*(help|idk|what|huh|\?+)\s*$/i.test(userMsg)) score -= 0.3;

  // Check for genuine curiosity beyond assignment
  const surplusKnowledgePatterns = [
    /\b(also|additionally|furthermore)\b/i,
    /\b(related to this|connected to)\b/i,
    /\b(real[- ]world|practical) (application|use|example)\b/i,
    /\b(learn more about|interested in)\b/i
  ];

  const isSurplusKnowledge = surplusKnowledgePatterns.some(p => p.test(userMsg));
  if (isSurplusKnowledge) score += 0.15;

  // Cap score between 0 and 1
  const overallScore = Math.max(0, Math.min(1, score));

  return {
    isSeekingUnderstanding,
    isSurplusKnowledge,
    showsWorkInProgress,
    isSpecificQuestion,
    overallScore
  };
}

/**
 * Calculates time-based metrics for engagement analysis
 */
export function analyzeEngagement(
  timeSpentOnTask: number,
  previousSubmissions: Submission[],
  currentSubmission: Submission | null
): {
  isRushing: boolean;
  showsPersistence: boolean;
  progressionQuality: 'improving' | 'declining' | 'stable';
} {
  const minReasonableTime = 60000; // 1 minute
  const isRushing = timeSpentOnTask < minReasonableTime && previousSubmissions.length === 0;

  const showsPersistence = previousSubmissions.length >= 2;

  let progressionQuality: 'improving' | 'declining' | 'stable' = 'stable';

  if (previousSubmissions.length >= 2) {
    const recent = previousSubmissions.slice(-2);
    const oldWordCount = recent[0].wordCount || 0;
    const newWordCount = recent[1].wordCount || 0;

    if (newWordCount > oldWordCount * 1.2) {
      progressionQuality = 'improving';
    } else if (newWordCount < oldWordCount * 0.8) {
      progressionQuality = 'declining';
    }
  }

  return {
    isRushing,
    showsPersistence,
    progressionQuality
  };
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
  isPolicyBypassAttempt,
  analyzeQuestionIntent,
  analyzeEngagement,
  hasGenuineAttempt,
  AssignmentSchema,
  SubmissionSchema,
  DEFAULT_HINT_POLICY
};