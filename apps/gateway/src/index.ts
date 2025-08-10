import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import { z } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: any) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Schemas for API validation
const LLMRequestSchema = z.object({
  tenantId: z.string(),
  prompt: z.string(),
  model: z.string().optional(),
  maxTokens: z.number().max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  context: z.object({
    assignmentId: z.string().optional(),
    submissionId: z.string().optional(),
    sessionId: z.string().optional()
  }).optional()
});

const TenantRequestSchema = z.object({
  tenantId: z.string()
});

type LLMRequest = z.infer<typeof LLMRequestSchema>;
type TenantRequest = z.infer<typeof TenantRequestSchema>;

// In-memory stores (would use Redis/Database in production)
const tenantBudgets = new Map<string, {
  monthlyLimit: number;
  currentUsage: number;
  resetDate: string;
}>();

const tenantConfigs = new Map<string, any>();

// Load tenant configurations on startup
async function loadTenantConfigs() {
  try {
    const fixturesPath = path.join(__dirname, '../../../fixtures/tenant.json');
    const data = await fs.readFile(fixturesPath, 'utf-8');
    const config = JSON.parse(data);
    
    for (const tenant of config.tenants) {
      tenantConfigs.set(tenant.id, tenant);
      tenantBudgets.set(tenant.id, {
        monthlyLimit: tenant.budget.monthlyTokenLimit,
        currentUsage: tenant.budget.currentUsage,
        resetDate: tenant.budget.resetDate
      });
    }
    
    logger.info(`Loaded ${config.tenants.length} tenant configurations`);
  } catch (error) {
    logger.error('Failed to load tenant configurations:', error);
  }
}

// Policy check function
function policyCheck(prompt: string, tenantId: string): { allowed: boolean; reason?: string } {
  const tenant = tenantConfigs.get(tenantId);
  if (!tenant) {
    return { allowed: false, reason: 'Unknown tenant' };
  }

  // Check for attempts to bypass educational guardrails
  const bypassPatterns = [
    /ignore (all )?previous (instructions|prompts)/i,
    /you are (now )?a (different|new)/i,
    /forget (everything|all)/i,
    /act as (if )?you (are|were)/i,
    /roleplay/i,
    /pretend (you are|to be)/i
  ];

  for (const pattern of bypassPatterns) {
    if (pattern.test(prompt)) {
      return { allowed: false, reason: 'Attempted policy bypass detected' };
    }
  }

  // Check for direct answer requests that should be blocked
  const directAnswerPatterns = [
    /give me the (complete|full|exact) answer/i,
    /solve this (completely|entirely|for me)/i,
    /do my homework/i,
    /write my (essay|report|assignment)/i
  ];

  for (const pattern of directAnswerPatterns) {
    if (pattern.test(prompt)) {
      return { allowed: false, reason: 'Direct answer request blocked by educational policy' };
    }
  }

  return { allowed: true };
}

// Check tenant budget
function checkTenantBudget(tenantId: string, estimatedTokens: number = 100): { allowed: boolean; reason?: string } {
  const budget = tenantBudgets.get(tenantId);
  if (!budget) {
    return { allowed: false, reason: 'Tenant budget not found' };
  }

  if (budget.currentUsage + estimatedTokens > budget.monthlyLimit) {
    return { allowed: false, reason: 'Monthly token limit exceeded' };
  }

  return { allowed: true };
}

// Mock LLM provider (would integrate with actual providers)
async function callLLMProvider(request: LLMRequest & { allowed: boolean }): Promise<{
  content: string;
  tokensUsed: number;
  model: string;
}> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
  
  if (!request.allowed) {
    return {
      content: "I'm designed to provide educational guidance through hints and explanations rather than direct answers. Please share your attempt at the problem first, and I'll help guide you toward the solution.",
      tokensUsed: 45,
      model: request.model || 'claude-3-sonnet'
    };
  }

  // Mock educational response based on prompt analysis
  let response: string;
  
  if (request.prompt.toLowerCase().includes('hint') || request.prompt.toLowerCase().includes('help')) {
    response = "I can see you're working on this problem. Here's a hint to guide your thinking: Start by identifying what type of problem this is and what information you have. What approach do you think might work here? Try breaking it down into smaller steps.";
  } else if (request.prompt.toLowerCase().includes('explain')) {
    response = "Let me help explain this concept. The key idea here is to understand the underlying principle. Can you tell me what you understand so far? I'll build on your current knowledge to help clarify the concept.";
  } else {
    response = "I'm here to support your learning journey. Could you share what you've tried so far? This will help me provide more targeted guidance that builds on your current understanding.";
  }

  return {
    content: response,
    tokensUsed: Math.floor(response.length / 4), // Rough token estimation
    model: request.model || 'claude-3-sonnet'
  };
}

// Update tenant usage
function updateTenantUsage(tenantId: string, tokensUsed: number) {
  const budget = tenantBudgets.get(tenantId);
  if (budget) {
    budget.currentUsage += tokensUsed;
    tenantBudgets.set(tenantId, budget);
  }
}

// Express app setup
const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://studio.chalkline.ai'] : ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  next();
});

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// LLM endpoint
app.post('/v1/llm', async (req, res) => {
  try {
    const request = LLMRequestSchema.parse(req.body);
    
    // Check tenant budget
    const budgetCheck = checkTenantBudget(request.tenantId);
    if (!budgetCheck.allowed) {
      return res.status(402).json({ 
        error: 'Payment Required',
        message: budgetCheck.reason 
      });
    }

    // Policy check
    const policyResult = policyCheck(request.prompt, request.tenantId);
    
    // Call LLM provider
    const response = await callLLMProvider({
      ...request,
      allowed: policyResult.allowed
    });

    // Update usage
    updateTenantUsage(request.tenantId, response.tokensUsed);

    // Log the interaction
    logger.info({
      tenantId: request.tenantId,
      tokensUsed: response.tokensUsed,
      model: response.model,
      policyAllowed: policyResult.allowed,
      policyReason: policyResult.reason
    });

    res.json({
      content: response.content,
      model: response.model,
      tokensUsed: response.tokensUsed,
      policyInfo: {
        allowed: policyResult.allowed,
        reason: policyResult.reason
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.errors 
      });
    }
    
    logger.error('LLM endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tenant info endpoint
app.get('/v1/tenant/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const config = tenantConfigs.get(tenantId);
    const budget = tenantBudgets.get(tenantId);
    
    if (!config || !budget) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      tenant: {
        id: config.id,
        name: config.name,
        plan: config.plan,
        features: config.settings.features
      },
      budget: {
        monthlyLimit: budget.monthlyLimit,
        currentUsage: budget.currentUsage,
        remainingTokens: budget.monthlyLimit - budget.currentUsage,
        resetDate: budget.resetDate,
        usagePercentage: Math.round((budget.currentUsage / budget.monthlyLimit) * 100)
      }
    });

  } catch (error) {
    logger.error('Tenant endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Budget reset endpoint (for testing/admin)
app.post('/v1/tenant/:tenantId/reset-budget', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const budget = tenantBudgets.get(tenantId);
    
    if (!budget) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    budget.currentUsage = 0;
    budget.resetDate = new Date().toISOString();
    tenantBudgets.set(tenantId, budget);

    logger.info(`Budget reset for tenant: ${tenantId}`);
    
    res.json({ 
      message: 'Budget reset successfully',
      budget: {
        monthlyLimit: budget.monthlyLimit,
        currentUsage: budget.currentUsage,
        resetDate: budget.resetDate
      }
    });

  } catch (error) {
    logger.error('Budget reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  await loadTenantConfigs();
  
  app.listen(port, () => {
    logger.info(`🚀 Chalkline.AI Gateway running on port ${port}`);
    logger.info(`📊 Loaded ${tenantConfigs.size} tenants`);
    logger.info(`🔒 Rate limiting: 100 requests per minute per IP`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default app;