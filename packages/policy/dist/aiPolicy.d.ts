import { z } from 'zod';
export declare const AssignmentSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    questions: z.ZodArray<z.ZodString, "many">;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodDate>;
    subject: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    questions: string[];
    description?: string | undefined;
    dueDate?: Date | undefined;
    subject?: string | undefined;
}, {
    id: string;
    title: string;
    questions: string[];
    description?: string | undefined;
    dueDate?: Date | undefined;
    subject?: string | undefined;
}>;
export declare const SubmissionSchema: z.ZodObject<{
    questionId: z.ZodString;
    text: z.ZodString;
    attempts: z.ZodNumber;
    timestamp: z.ZodDate;
    wordCount: z.ZodOptional<z.ZodNumber>;
    timeSpent: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    questionId: string;
    text: string;
    attempts: number;
    timestamp: Date;
    wordCount?: number | undefined;
    timeSpent?: number | undefined;
}, {
    questionId: string;
    text: string;
    attempts: number;
    timestamp: Date;
    wordCount?: number | undefined;
    timeSpent?: number | undefined;
}>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type ResponseMode = "NORM_CHAT" | "TRY_FIRST" | "HINTS_ONLY";
/**
 * Core policy engine that determines how the AI should respond to student queries
 * Based on assignment context and submission history
 */
export declare function decideResponseMode(userMsg: string, assignment: Assignment | null, submission: Submission | null): ResponseMode;
/**
 * Checks if a user message is asking for direct answers
 */
export declare function isAskingForAnswer(userMsg: string): boolean;
/**
 * Analyzes submission quality to determine if student has made genuine attempt
 */
export declare function hasGenuineAttempt(submission: Submission): boolean;
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
export declare const DEFAULT_HINT_POLICY: HintPolicy;
/**
 * Context information for policy decisions
 */
export interface PolicyContext {
    assignment: Assignment | null;
    submission: Submission | null;
    userMessage: string;
    sessionHints: number;
    timeSpentOnTask: number;
    previousSubmissions: Submission[];
}
/**
 * Enhanced policy engine with context awareness
 */
export declare function makeResponseDecision(context: PolicyContext): {
    mode: ResponseMode;
    reasoning: string;
    allowHints: boolean;
    suggestedAction?: string;
};
declare const _default: {
    decideResponseMode: typeof decideResponseMode;
    makeResponseDecision: typeof makeResponseDecision;
    isAskingForAnswer: typeof isAskingForAnswer;
    hasGenuineAttempt: typeof hasGenuineAttempt;
    AssignmentSchema: z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        questions: z.ZodArray<z.ZodString, "many">;
        description: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodOptional<z.ZodDate>;
        subject: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        questions: string[];
        description?: string | undefined;
        dueDate?: Date | undefined;
        subject?: string | undefined;
    }, {
        id: string;
        title: string;
        questions: string[];
        description?: string | undefined;
        dueDate?: Date | undefined;
        subject?: string | undefined;
    }>;
    SubmissionSchema: z.ZodObject<{
        questionId: z.ZodString;
        text: z.ZodString;
        attempts: z.ZodNumber;
        timestamp: z.ZodDate;
        wordCount: z.ZodOptional<z.ZodNumber>;
        timeSpent: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        text: string;
        attempts: number;
        timestamp: Date;
        wordCount?: number | undefined;
        timeSpent?: number | undefined;
    }, {
        questionId: string;
        text: string;
        attempts: number;
        timestamp: Date;
        wordCount?: number | undefined;
        timeSpent?: number | undefined;
    }>;
    DEFAULT_HINT_POLICY: HintPolicy;
};
export default _default;
