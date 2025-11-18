/**
 * Rubric Evaluator System
 * Automatically grades student submissions based on teacher-provided rubrics
 */

import type { Rubric, RubricCriterion, RubricEvaluation, Submission } from '../../studio/src/types';

interface EvaluationContext {
  submission: Submission;
  rubric: Rubric;
  assignmentContext?: string;
  previousFeedback?: string[];
}

interface CriterionScore {
  criterionId: string;
  selectedLevel: string;
  points: number;
  feedback: string;
  confidence: number;
}

/**
 * Analyze submission text for criterion
 */
function analyzeSubmissionForCriterion(
  submissionText: string,
  criterion: RubricCriterion
): CriterionScore {
  // This is a mock implementation
  // In production, this would use an LLM API (OpenAI, Anthropic, etc.)

  const wordCount = submissionText.split(/\s+/).length;
  const hasStructure = /\n\n/.test(submissionText);
  const hasExamples = /(for example|such as|like|including)/i.test(submissionText);
  const complexity = submissionText.match(/[.!?]/g)?.length || 1;

  // Simple heuristic scoring (would be replaced with LLM analysis)
  let scoreIndex = 0;
  let confidence = 0.7;

  if (criterion.id.includes('understanding') || criterion.id.includes('setup')) {
    if (wordCount > 50 && hasStructure) {
      scoreIndex = 3; // Excellent
      confidence = 0.85;
    } else if (wordCount > 30) {
      scoreIndex = 2; // Good
      confidence = 0.75;
    } else if (wordCount > 15) {
      scoreIndex = 1; // Satisfactory
      confidence = 0.65;
    } else {
      scoreIndex = 0; // Needs improvement
      confidence = 0.6;
    }
  } else if (criterion.id.includes('method') || criterion.id.includes('application')) {
    if (complexity > 3 && hasExamples) {
      scoreIndex = 3;
      confidence = 0.9;
    } else if (complexity > 2) {
      scoreIndex = 2;
      confidence = 0.75;
    } else if (complexity > 1) {
      scoreIndex = 1;
      confidence = 0.65;
    } else {
      scoreIndex = 0;
      confidence = 0.6;
    }
  }

  // Ensure scoreIndex doesn't exceed available levels
  scoreIndex = Math.min(scoreIndex, criterion.levels.length - 1);

  const selectedLevel = criterion.levels[scoreIndex];

  const feedback = generateFeedback(submissionText, criterion, selectedLevel);

  return {
    criterionId: criterion.id,
    selectedLevel: selectedLevel.label,
    points: selectedLevel.points,
    feedback,
    confidence
  };
}

/**
 * Generate specific feedback for a criterion
 */
function generateFeedback(
  submissionText: string,
  criterion: RubricCriterion,
  selectedLevel: { label: string; points: number; description: string }
): string {
  // Mock feedback generation (would use LLM in production)
  const feedbackTemplates = {
    'Excellent': [
      `Strong work on ${criterion.description.toLowerCase()}. Your response demonstrates comprehensive understanding.`,
      `Excellent grasp of ${criterion.description.toLowerCase()}. Well done!`,
      `Outstanding work. Your approach to ${criterion.description.toLowerCase()} shows mastery.`
    ],
    'Good': [
      `Good work on ${criterion.description.toLowerCase()}. Consider expanding your explanation.`,
      `Solid understanding shown. A few more details would strengthen your response.`,
      `Good grasp of the concept. Try to provide more specific examples.`
    ],
    'Satisfactory': [
      `You show basic understanding of ${criterion.description.toLowerCase()}, but more detail is needed.`,
      `This needs more development. Review the key concepts and expand your answer.`,
      `Basic understanding demonstrated. Add more depth to your explanation.`
    ],
    'Needs Improvement': [
      `This section needs significant development. Review ${criterion.description.toLowerCase()} and try again.`,
      `More work needed here. Make sure you understand the fundamentals first.`,
      `This needs substantial improvement. Seek help if you're struggling with this concept.`
    ]
  };

  const templates = feedbackTemplates[selectedLevel.label as keyof typeof feedbackTemplates] || feedbackTemplates['Satisfactory'];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Evaluate a submission against a rubric
 */
export async function evaluateSubmission(
  context: EvaluationContext
): Promise<RubricEvaluation> {
  const { submission, rubric } = context;

  console.log(`\nEvaluating submission: ${submission.id}`);
  console.log(`Using rubric: ${rubric.title}\n`);

  const criteriaScores: CriterionScore[] = [];

  // Evaluate each criterion
  for (const criterion of rubric.criteria) {
    console.log(`Analyzing criterion: ${criterion.description}`);
    const score = analyzeSubmissionForCriterion(submission.text, criterion);
    criteriaScores.push(score);
    console.log(`  → ${score.selectedLevel} (${score.points} points, ${Math.round(score.confidence * 100)}% confidence)`);
  }

  // Calculate total points
  const totalPoints = criteriaScores.reduce((sum, score) => sum + score.points, 0);

  // Generate overall feedback
  const overallFeedback = generateOverallFeedback(criteriaScores, totalPoints, rubric.totalPoints);

  const evaluation: RubricEvaluation = {
    rubricId: rubric.id,
    submissionId: submission.id,
    criteria: criteriaScores.map(score => ({
      criterionId: score.criterionId,
      selectedLevel: score.selectedLevel,
      points: score.points,
      feedback: score.feedback
    })),
    totalPoints,
    overallFeedback,
    evaluatedBy: 'ai',
    timestamp: new Date()
  };

  console.log(`\nTotal Score: ${totalPoints}/${rubric.totalPoints}`);
  console.log(`Overall Feedback: ${overallFeedback}\n`);

  return evaluation;
}

/**
 * Generate overall feedback for the submission
 */
function generateOverallFeedback(
  scores: CriterionScore[],
  totalPoints: number,
  maxPoints: number
): string {
  const percentage = (totalPoints / maxPoints) * 100;

  let performanceLevel: string;
  let feedback: string;

  if (percentage >= 90) {
    performanceLevel = 'Excellent';
    feedback = 'Outstanding work! You demonstrate a strong mastery of the material. Keep up the excellent effort.';
  } else if (percentage >= 75) {
    performanceLevel = 'Good';
    feedback = 'Good work overall. You show solid understanding, though there are a few areas that could be strengthened. Review the feedback for each criterion.';
  } else if (percentage >= 60) {
    performanceLevel = 'Satisfactory';
    feedback = 'You show basic understanding, but several areas need more development. Focus on the criteria where you scored lower and seek help if needed.';
  } else {
    performanceLevel = 'Needs Improvement';
    feedback = 'This submission needs significant improvement. Please review the material carefully and consider meeting with your teacher for additional support.';
  }

  // Add specific strengths and weaknesses
  const strengths = scores.filter(s => s.confidence > 0.8 && s.points >= 3);
  const weaknesses = scores.filter(s => s.points <= 2);

  if (strengths.length > 0) {
    feedback += ` Strengths: ${strengths.map(s => s.criterionId).join(', ')}.`;
  }

  if (weaknesses.length > 0) {
    feedback += ` Areas for improvement: ${weaknesses.map(s => s.criterionId).join(', ')}.`;
  }

  return `Performance Level: ${performanceLevel}. ${feedback}`;
}

/**
 * Batch evaluate multiple submissions
 */
export async function batchEvaluate(
  submissions: Submission[],
  rubric: Rubric
): Promise<RubricEvaluation[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Batch Evaluation: ${submissions.length} submissions`);
  console.log(`Rubric: ${rubric.title}`);
  console.log(`${'='.repeat(60)}\n`);

  const evaluations: RubricEvaluation[] = [];

  for (const submission of submissions) {
    const evaluation = await evaluateSubmission({ submission, rubric });
    evaluations.push(evaluation);
  }

  // Generate summary statistics
  console.log(`\n${'='.repeat(60)}`);
  console.log('Batch Evaluation Summary');
  console.log(`${'='.repeat(60)}`);

  const avgScore = evaluations.reduce((sum, e) => sum + e.totalPoints, 0) / evaluations.length;
  const maxScore = Math.max(...evaluations.map(e => e.totalPoints));
  const minScore = Math.min(...evaluations.map(e => e.totalPoints));

  console.log(`Average Score: ${avgScore.toFixed(1)}/${rubric.totalPoints}`);
  console.log(`Highest Score: ${maxScore}/${rubric.totalPoints}`);
  console.log(`Lowest Score: ${minScore}/${rubric.totalPoints}`);
  console.log(`${'='.repeat(60)}\n`);

  return evaluations;
}

/**
 * Export evaluation results to JSON
 */
export function exportEvaluations(
  evaluations: RubricEvaluation[],
  filename: string = 'evaluations.json'
): void {
  const json = JSON.stringify(evaluations, null, 2);

  // In Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const fs = require('fs');
    fs.writeFileSync(filename, json);
    console.log(`✅ Exported ${evaluations.length} evaluations to ${filename}`);
  } else {
    // In browser environment
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    console.log(`✅ Downloaded ${evaluations.length} evaluations as ${filename}`);
  }
}

export default {
  evaluateSubmission,
  batchEvaluate,
  exportEvaluations
};
