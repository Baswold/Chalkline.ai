import type { Assignment, Submission, Rubric, TenantConfig } from '../types';

export const assignmentsData: Assignment[] = [
  {
    id: 'assignment-001',
    title: 'Quadratic Equations and Their Applications',
    subject: 'Mathematics',
    description: 'Solve quadratic equations using different methods and apply them to real-world problems.',
    questions: [
      'Solve the quadratic equation x² - 5x + 6 = 0 using factoring',
      'Use the quadratic formula to solve 2x² + 3x - 2 = 0',
      'A ball is thrown upward with an initial velocity of 40 ft/s from a height of 6 ft. The height h(t) = -16t² + 40t + 6. When will the ball hit the ground?',
      'Explain when you would use factoring vs. the quadratic formula'
    ],
    dueDate: new Date('2025-08-15T23:59:00Z'),
    rubricId: 'rubric-math-001'
  },
  {
    id: 'assignment-002',
    title: 'The American Civil War: Causes and Consequences',
    subject: 'History',
    description: 'Analyze the major causes of the American Civil War and evaluate its long-term consequences.',
    questions: [
      'Identify and explain three major causes of the American Civil War',
      'How did economic differences between North and South contribute to the conflict?',
      'Analyze the role of slavery in causing the Civil War',
      'Evaluate the long-term consequences of the Civil War on American society'
    ],
    dueDate: new Date('2025-08-20T23:59:00Z'),
    rubricId: 'rubric-history-001'
  },
  {
    id: 'assignment-003',
    title: 'Chemical Reactions and Stoichiometry',
    subject: 'Chemistry',
    description: 'Balance chemical equations and perform stoichiometric calculations.',
    questions: [
      'Balance the equation: Fe + O₂ → Fe₂O₃',
      'How many grams of water are produced when 25g of hydrogen react with excess oxygen?',
      'Explain the law of conservation of mass in chemical reactions',
      'Calculate the theoretical yield when 50g of CaCO₃ decomposes to form CaO and CO₂'
    ],
    dueDate: new Date('2025-08-18T23:59:00Z'),
    rubricId: 'rubric-chemistry-001'
  },
  {
    id: 'assignment-004',
    title: 'Shakespearean Sonnet Analysis',
    subject: 'English Literature',
    description: 'Analyze the structure, themes, and literary devices in Shakespeare\'s Sonnet 18.',
    questions: [
      'Identify and explain the rhyme scheme of Sonnet 18',
      'What is the central metaphor in the poem and how does it develop?',
      'Analyze the use of imagery in the first quatrain',
      'How does the final couplet provide resolution to the poem\'s argument?'
    ],
    dueDate: new Date('2025-08-22T23:59:00Z'),
    rubricId: 'rubric-literature-001'
  }
];

export const sampleSubmissions: Submission[] = [
  {
    id: 'submission-001',
    questionId: 'Solve the quadratic equation x² - 5x + 6 = 0 using factoring',
    text: 'I think I need to find two numbers that multiply to 6 and add to -5. Those would be -2 and -3. So (x-2)(x-3) = 0, which means x = 2 or x = 3.',
    attempts: 1,
    timestamp: new Date('2025-08-10T14:30:00Z'),
    wordCount: 35,
    timeSpent: 300000
  },
  {
    id: 'submission-002',
    questionId: 'Identify and explain three major causes of the American Civil War',
    text: 'The three major causes of the Civil War were: 1) Slavery - the South wanted to keep slavery while the North wanted to abolish it. 2) States\' rights - Southern states believed they should have more control over their own laws. 3) Economic differences - the North was industrial while the South was agricultural and depended on slave labor.',
    attempts: 2,
    timestamp: new Date('2025-08-10T15:00:00Z'),
    wordCount: 58,
    timeSpent: 1200000
  }
];

export const sampleRubrics: Rubric[] = [
  {
    id: 'rubric-math-001',
    title: 'Quadratic Equations Rubric',
    subject: 'Mathematics',
    totalPoints: 20,
    criteria: [
      {
        id: 'problem-setup',
        description: 'Problem Setup and Understanding',
        weight: 0.2,
        levels: [
          {
            label: 'Excellent',
            points: 4,
            description: 'Clearly identifies the problem type, shows complete understanding of what is being asked'
          },
          {
            label: 'Good',
            points: 3,
            description: 'Identifies problem type with minor confusion, mostly understands what is being asked'
          },
          {
            label: 'Satisfactory',
            points: 2,
            description: 'Some understanding of problem type, partially understands what is being asked'
          },
          {
            label: 'Needs Improvement',
            points: 1,
            description: 'Limited understanding of problem type or what is being asked'
          }
        ]
      },
      {
        id: 'method-selection',
        description: 'Method Selection and Application',
        weight: 0.3,
        levels: [
          {
            label: 'Excellent',
            points: 4,
            description: 'Selects most appropriate method, applies it correctly and efficiently'
          },
          {
            label: 'Good',
            points: 3,
            description: 'Selects appropriate method, applies it correctly with minor errors'
          },
          {
            label: 'Satisfactory',
            points: 2,
            description: 'Selects workable method, applies it with some errors or inefficiency'
          },
          {
            label: 'Needs Improvement',
            points: 1,
            description: 'Selects inappropriate method or applies method with major errors'
          }
        ]
      }
    ]
  }
];

export const sampleTenantConfig: TenantConfig = {
  id: 'oakwood-high',
  name: 'Oakwood High School',
  domain: 'oakwood.edu',
  plan: 'premium',
  settings: {
    maxStudentsPerClass: 35,
    allowedModels: ['gpt-4', 'claude-3-sonnet'],
    defaultModel: 'claude-3-sonnet',
    features: {
      voiceInput: true,
      imageGeneration: true,
      advancedAnalytics: true,
      customRubrics: true
    }
  },
  budget: {
    monthlyTokenLimit: 1000000,
    currentUsage: 245000,
    costPerToken: 0.00001,
    resetDate: '2025-09-01'
  }
};

// Mock API responses for development
export const mockHintResponses = {
  'quadratic': [
    'Great start! When factoring quadratics, you\'re looking for two numbers that multiply to give you the constant term and add to give you the coefficient of the x term. What two numbers do you think would work here?',
    'You\'re on the right track with factoring. Remember that once you have your factors, you can set each one equal to zero to find your solutions. Can you show me the next step?',
    'Perfect! You found the factors correctly. Now, what does the zero product property tell us about solving (x-2)(x-3) = 0?'
  ],
  'civil-war': [
    'You\'ve identified slavery as a major cause - that\'s correct! Can you think about what specific events or legislation related to slavery increased tensions between North and South?',
    'Good point about economic differences. How do you think the different economic systems (industrial vs. agricultural) created conflict over things like tariffs and trade policies?',
    'You mention states\' rights - can you give a specific example of a situation where Southern states felt their rights were being violated by the federal government?'
  ],
  'chemistry': [
    'When balancing equations, remember that you need the same number of atoms of each element on both sides. Start by counting the atoms of each element. What do you notice about the iron atoms?',
    'Good approach! Balancing can be tricky with multiple elements. Try starting with the most complex molecule first. Which molecule in this equation has the most different types of atoms?',
    'You\'re getting close! Remember that you can only change the coefficients (the numbers in front), never the subscripts in the chemical formulas.'
  ]
};

export const sampleTimelineEvents = [
  {
    id: 'event-001',
    type: 'assignment-opened' as const,
    timestamp: new Date('2025-08-10T14:00:00Z'),
    description: 'Opened assignment: Quadratic Equations',
    assignmentId: 'assignment-001'
  },
  {
    id: 'event-002',
    type: 'submission' as const,
    timestamp: new Date('2025-08-10T14:30:00Z'),
    description: 'Submitted answer for question 1 (35 words)',
    assignmentId: 'assignment-001'
  },
  {
    id: 'event-003',
    type: 'hint-given' as const,
    timestamp: new Date('2025-08-10T14:35:00Z'),
    description: 'AI tutor provided guidance on factoring method',
    assignmentId: 'assignment-001'
  }
];