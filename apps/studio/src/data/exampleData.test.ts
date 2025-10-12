import { describe, it, expect } from 'vitest';
import { assignmentsData, sampleRubrics, sampleTenantConfig } from './exampleData';

describe('studio example dataset', () => {
  it('provides assignments with questions and due dates', () => {
    expect(assignmentsData.length).toBeGreaterThan(0);

    for (const assignment of assignmentsData) {
      expect(Array.isArray(assignment.questions)).toBe(true);
      expect(assignment.questions.length).toBeGreaterThan(2);
      expect(assignment.dueDate).toBeInstanceOf(Date);
    }
  });

  it('maps rubrics to the assignments that reference them', () => {
    const rubricIds = new Set(sampleRubrics.map(rubric => rubric.id));
    const referencedRubrics = new Set(
      assignmentsData.map(assignment => assignment.rubricId).filter((id): id is string => Boolean(id))
    );

    for (const rubricId of rubricIds) {
      expect(referencedRubrics.has(rubricId)).toBe(true);
    }
  });

  it('includes tenant configuration defaults for feature flags', () => {
    expect(sampleTenantConfig.settings.features.voiceInput).toBeTypeOf('boolean');
    expect(sampleTenantConfig.settings.allowedModels.length).toBeGreaterThan(0);
    expect(sampleTenantConfig.settings.defaultModel).toBeTypeOf('string');
  });
});
