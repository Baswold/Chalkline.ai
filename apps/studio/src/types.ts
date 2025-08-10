// Core types for Chalkline.AI Studio

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description?: string;
  questions: string[];
  dueDate?: Date;
  rubricId?: string;
}

export interface Submission {
  id: string;
  questionId: string;
  text: string;
  attempts: number;
  timestamp: Date;
  wordCount?: number;
  timeSpent?: number; // in milliseconds
}

export interface TimelineEvent {
  id: string;
  type: 'assignment-opened' | 'submission' | 'hint-given' | 'tab-switch' | 'rubric-tick';
  timestamp: Date;
  description: string;
  assignmentId?: string;
  metadata?: Record<string, any>;
}

export type WorkTab = 'DOC' | 'PDF' | 'BOARD';

export type TutorMode = 'NORM_CHAT' | 'TRY_FIRST' | 'HINTS_ONLY';

export interface AppState {
  activeAssignment: Assignment | null;
  activeTab: WorkTab;
  tutorMode: TutorMode;
  submissions: Submission[];
  timelineEvents: TimelineEvent[];
}

export interface TutorMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode: TutorMode;
}

export interface HintContext {
  assignment: Assignment;
  submission: Submission | null;
  userMessage: string;
  sessionHints: number;
}

export interface KeybindEvent {
  type: 'hint-request' | 'inline-suggestion' | 'command-palette';
  context: {
    cursorPosition?: number;
    selectedText?: string;
    currentContent?: string;
  };
}

export interface PDFAnnotation {
  id: string;
  type: 'highlight' | 'note' | 'ink';
  page: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  color?: string;
  timestamp: Date;
  author?: string;
}

export interface W3CAnnotation {
  '@context': string;
  id: string;
  type: string;
  body: {
    type: string;
    value: string;
    format?: string;
  };
  target: {
    source: string;
    selector?: {
      type: string;
      start?: number;
      end?: number;
      exact?: string;
    };
  };
  created: string;
  creator?: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface Shape {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'ellipse' | 'polygon';
  points: DrawingPoint[];
  style: {
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    opacity?: number;
  };
  snapped?: boolean;
}

export interface PolicyContext {
  assignment: Assignment | null;
  submission: Submission | null;
  userMessage: string;
  sessionHints: number;
  timeSpentOnTask: number;
  previousSubmissions: Submission[];
}

export interface RubricCriterion {
  id: string;
  description: string;
  weight: number;
  levels: Array<{
    label: string;
    points: number;
    description: string;
  }>;
}

export interface Rubric {
  id: string;
  title: string;
  subject: string;
  criteria: RubricCriterion[];
  totalPoints: number;
}

export interface RubricEvaluation {
  rubricId: string;
  submissionId: string;
  criteria: Array<{
    criterionId: string;
    selectedLevel: string;
    points: number;
    feedback?: string;
  }>;
  totalPoints: number;
  overallFeedback?: string;
  evaluatedBy: 'ai' | 'teacher' | 'peer';
  timestamp: Date;
}

export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  plan: string;
  settings: {
    maxStudentsPerClass: number;
    allowedModels: string[];
    defaultModel: string;
    features: {
      voiceInput: boolean;
      imageGeneration: boolean;
      advancedAnalytics: boolean;
      customRubrics: boolean;
    };
  };
  budget: {
    monthlyTokenLimit: number;
    currentUsage: number;
    costPerToken: number;
    resetDate: string;
  };
}

// Component prop types
export interface AssignmentTrayProps {
  assignments: Assignment[];
  activeAssignment: Assignment | null;
  onAssignmentSelect: (assignment: Assignment) => void;
}

export interface WorkAreaProps {
  activeTab: WorkTab;
  activeAssignment: Assignment | null;
  onTabChange: (tab: WorkTab) => void;
  onSubmission: (questionId: string, text: string) => void;
  submissions: Submission[];
}

export interface TutorDockProps {
  mode: TutorMode;
  activeAssignment: Assignment | null;
  submissions: Submission[];
  onInteraction: (message: string) => void;
}

export interface TimelineProps {
  events: TimelineEvent[];
  activeAssignment: Assignment | null;
}

export interface DocEditorProps {
  assignment: Assignment | null;
  onSubmission: (questionId: string, text: string) => void;
  submissions: Submission[];
}

export interface PDFAnnotatorProps {
  pdfUrl?: string;
  assignment: Assignment | null;
  annotations: PDFAnnotation[];
  onAnnotationAdd: (annotation: PDFAnnotation) => void;
  onAnnotationUpdate: (id: string, annotation: Partial<PDFAnnotation>) => void;
  onAnnotationDelete: (id: string) => void;
}

export interface WhiteboardProps {
  assignment: Assignment | null;
  shapes: Shape[];
  onShapeAdd: (shape: Shape) => void;
  onShapeUpdate: (id: string, shape: Partial<Shape>) => void;
  onShapeDelete: (id: string) => void;
}