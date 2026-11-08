const { z } = require('zod');

// M14: zod schema validation. Malformed input now fails fast with a clean 400
// (and per-field details) instead of blowing up downstream as a 500.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues
          .map((i) => ({ field: i.path.join('.') || source, message: i.message }))
          .slice(0, 10),
      });
    }
    req[source] = result.data;
    next();
  };
}

const schemas = {
  emailLogin: z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(256),
    totp: z.string().regex(/^\d{6}$/).optional(),
  }),
  totpCode: z.object({
    code: z.string().regex(/^\d{6}$/, 'Code must be the 6-digit number from your authenticator app'),
  }),
  createCase: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional().nullable(),
    case_type: z.string().max(50).optional().nullable(),
    priority_level: z.coerce.number().int().min(1).max(5).optional(),
    jurisdiction: z.string().max(100).optional().nullable(),
  }).passthrough(),
  updateCaseStatus: z.object({
    newStatusCode: z.string().min(1).max(50),
    reason: z.string().max(1000).optional().nullable(),
    metadata: z.record(z.any()).optional(),
  }),
  addCaseNote: z.object({
    content: z.string().min(1).max(10000),
    evidence_id: z.coerce.number().int().positive().optional().nullable(),
    annotation: z.string().max(2000).optional().nullable(),
  }),
  createAnalysisRequest: z.object({
    evidence_id: z.coerce.number().int().positive(),
    analysis_type: z.enum(['disk', 'memory', 'network', 'mobile', 'multimedia', 'report_review', 'general']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    notes: z.string().max(5000).optional().nullable(),
  }),
};

module.exports = { validate, schemas };
