const prisma = require('../utils/prisma');
const { createAuditEvent, auditContextFromReq } = require('../utils/audit');

const ADAPTER_DISCLAIMER = 'SIMULATED — No live government API call was made. This is prototype integration only.';

/**
 * GET /api/integrations/status — All connector status
 */
async function getIntegrationStatus(req, res, next) {
  try {
    const connectors = await prisma.integrationConnector.findMany({
      include: {
        _count: { select: { jobs: true } },
        jobs: { orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, status: true, jobType: true, createdAt: true, attempts: true } },
      },
    });

    res.json({
      connectors: connectors.map((c) => ({
        ...c,
        disclaimer: c.mode === 'SIMULATED' ? ADAPTER_DISCLAIMER : 'LIVE — official API connection',
      })),
    });
  } catch (err) { next(err); }
}

/**
 * POST /api/integrations/:adapter/test — Test a connector (returns simulated response)
 */
async function testConnector(req, res, next) {
  try {
    const { adapter } = req.params;

    const connector = await prisma.integrationConnector.findFirst({ where: { name: adapter } });
    if (!connector) return res.status(404).json({ error: 'Connector not found', code: 'NOT_FOUND' });

    // Simulate adapter responses
    const idempotencyKey = `test-${adapter}-${req.user.id}-${Date.now()}`;

    const job = await prisma.integrationJob.create({
      data: {
        connectorId: connector.id,
        jobType: 'HEALTH_CHECK',
        idempotencyKey,
        status: 'RUNNING',
        attempts: 1,
        requestMeta: { type: 'manual_test', initiatedBy: req.user.id },
      },
    });

    // Simulate processing
    let simulatedResponse;
    switch (adapter) {
      case 'APAAR_ABC':
        simulatedResponse = {
          status: 'SIMULATED_SUCCESS',
          message: 'APAAR/ABC adapter health check: simulated connection OK',
          sampleResponse: {
            validationResult: 'FORMAT_VALID_SIMULATED',
            identityStatus: 'PENDING_OFFICIAL_CHECK',
            note: 'This is a simulated response. No actual APAAR/ABC API call was made.',
          },
        };
        break;
      case 'INSTITUTION_ERP':
        simulatedResponse = {
          status: 'SIMULATED_SUCCESS',
          message: 'Institution ERP adapter: simulated sync OK',
          sampleResponse: {
            recordsReceived: 42,
            recordsProcessed: 38,
            recordsErrored: 4,
            note: 'Simulated ERP sync response. No live ERP system was contacted.',
          },
        };
        break;
      case 'AICTE':
        simulatedResponse = {
          status: 'SIMULATED_SUCCESS',
          message: 'AICTE adapter: simulated intake rule fetch OK',
          sampleResponse: {
            rulesVersion: '2025-26.v2',
            lastPublished: '2025-06-15',
            note: 'Simulated AICTE rules fetch. No live AICTE API was contacted.',
          },
        };
        break;
      default:
        simulatedResponse = { status: 'UNKNOWN_ADAPTER', message: `No simulation configured for adapter: ${adapter}` };
    }

    await prisma.integrationJob.update({
      where: { id: job.id },
      data: { status: 'SUCCESS', completedAt: new Date(), responseMeta: simulatedResponse },
    });

    await prisma.integrationConnector.update({
      where: { id: connector.id },
      data: { lastAttemptAt: new Date(), lastSuccessAt: new Date(), status: 'HEALTHY' },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'INTEGRATION_JOB_SUCCEEDED',
      entityType: 'IntegrationJob',
      entityId: job.id,
      reason: `Manual test of ${adapter} connector`,
    });

    res.json({
      job,
      result: simulatedResponse,
      disclaimer: ADAPTER_DISCLAIMER,
    });
  } catch (err) { next(err); }
}

/**
 * GET /api/integration-jobs — List integration jobs
 */
async function listIntegrationJobs(req, res, next) {
  try {
    const { page = 1, limit = 20, status, connectorId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (connectorId) where.connectorId = connectorId;

    const [jobs, total] = await Promise.all([
      prisma.integrationJob.findMany({
        where, skip: Number(skip), take: Number(limit),
        include: { connector: { select: { id: true, name: true, mode: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.integrationJob.count({ where }),
    ]);

    res.json({ jobs, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/**
 * POST /api/integration-jobs/:id/retry — Manual retry
 */
async function retryJob(req, res, next) {
  try {
    const job = await prisma.integrationJob.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'NOT_FOUND' });
    if (!['FAILED', 'CANCELLED'].includes(job.status)) {
      return res.status(400).json({ error: 'Only failed or cancelled jobs can be retried', code: 'INVALID_STATE' });
    }
    if (job.attempts >= job.maxAttempts) {
      return res.status(400).json({ error: 'Maximum retry attempts reached', code: 'MAX_RETRIES' });
    }

    const updated = await prisma.integrationJob.update({
      where: { id: req.params.id },
      data: { status: 'RETRYING', attempts: job.attempts + 1 },
    });

    await createAuditEvent({
      ...auditContextFromReq(req),
      action: 'INTEGRATION_JOB_STARTED',
      entityType: 'IntegrationJob',
      entityId: job.id,
      reason: 'Manual retry',
    });

    res.json({ job: updated, message: 'Job queued for retry (simulated mode)' });
  } catch (err) { next(err); }
}

module.exports = { getIntegrationStatus, testConnector, listIntegrationJobs, retryJob };
