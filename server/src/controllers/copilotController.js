const prisma = require('../utils/prisma');

/**
 * AICTE Approval Process Handbook (APH) Grounded Knowledge Base
 * Excerpts summarized for AICTE Approval, Intake Limits, NRI/OCI Quotas, and APAAR Integration
 */
const KNOWLEDGE_BASE = [
  {
    topic: 'Approved Intake and Seat Allocation',
    section: 'AICTE APH Chapter II — Grant of Approval',
    keywords: ['intake', 'capacity', 'limit', 'seats', 'increase', 'over enrollment', 'cap-01', 'supernumerary'],
    ruleCode: 'CAP-01',
    ruleVersion: '1.0.0',
    content: 'Institutions shall admit students only within the Approved Intake sanctioned by the AICTE for each programme. Any admission exceeding the approved intake is considered null and void, and penal action as per AICTE regulations may be initiated. Enrolment beyond approved capacity triggers CAP-01 compliance alert.',
  },
  {
    topic: 'NRI, OCI, and Foreign National (FN) Quotas',
    section: 'AICTE APH Chapter III — Supernumerary Seats',
    keywords: ['nri', 'oci', 'foreign national', 'fn', 'supernumerary', 'quota', 'cap-02', 'cap-03', 'pio'],
    ruleCode: 'CAP-02',
    ruleVersion: '1.0.0',
    content: 'A maximum of 15% supernumerary seats over and above the approved intake may be permitted for Foreign Nationals / Overseas Citizens of India (OCI) / Persons of Indian Origin (PIO) / Children of Indian Workers in Gulf Countries. Within this quota, NRI admissions must strictly not exceed one-third (5%) of the seats, subject to state/central admission regulatory guidelines.',
  },
  {
    topic: 'APAAR / ABC Academic Bank of Credits Mandate',
    section: 'AICTE & NEP 2020 Implementation Guidelines',
    keywords: ['apaar', 'abc', 'academic bank of credits', 'identifier', 'format', '12 digits', 'fmt-01', 'fmt-02', 'mandatory'],
    ruleCode: 'FMT-01',
    ruleVersion: '1.0.0',
    content: 'All students enrolled in AICTE-approved technical institutions must be onboarded onto the Academic Bank of Credits (ABC) and assigned a 12-digit Automated Permanent Academic Account Registry (APAAR) ID. APAAR ID ensures seamless credit transfer and single-point academic verification across Higher Education Institutions (HEIs).',
  },
  {
    topic: 'Cross-Institution Enrolment and Duplicate Prevention',
    section: 'AICTE Regulations — Prevention of Dual Regular Enrolments',
    keywords: ['duplicate', 'transfer', 'cross-institution', 'simultaneous', 'dup-01', 'dup-02', 'two colleges'],
    ruleCode: 'DUP-02',
    ruleVersion: '1.0.0',
    content: 'A student cannot maintain simultaneous active regular full-time enrolments in two different AICTE-approved institutions or programmes without formal approval or approved dual-degree framework under UGC/AICTE norms. Duplicate matches trigger an audit review and must be resolved as Confirmed Duplicate, Legitimate Transfer, or False Positive with recorded justification.',
  },
  {
    topic: 'Academic Year Continuity and Year-over-Year Inconsistencies',
    section: 'AICTE Data Validation & Compliance Auditing',
    keywords: ['yoy', 'year over year', 'drop', 'repeated', 'yoy-01', 'yoy-02', 'retention'],
    ruleCode: 'YOY-01',
    ruleVersion: '1.0.0',
    content: 'Sudden variance (>30%) in student strength or absence of admissions in previously active approved programmes without formal closure approval from AICTE requires regulatory explanation. Similarly, repeated active enrolment across academic years without progression requires validation check.',
  },
  {
    topic: 'Data Rectification and Privacy Governance',
    section: 'Digital Personal Data Protection (DPDP) Act Compliance in HEIs',
    keywords: ['privacy', 'masking', 'rectification', 'consent', 'audit', 'token', 'qr code', 'dpdp'],
    ruleCode: 'PRV-01',
    ruleVersion: '1.0.0',
    content: 'In compliance with digital privacy standards, full APAAR identifiers are masked in regular interfaces (e.g. DEMO-APAAR-****89) and hashed via cryptographic HMAC for duplicate checking. Verification is provided through opaque, revocable, single-use or time-bound QR tokens without exposing raw student database credentials.',
  },
];

/**
 * POST /api/copilot/query
 * Grounded query answering against AICTE Handbook and seeded validation rules
 */
async function queryCopilot(req, res, next) {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2);

    // Search internal knowledge base
    let bestMatch = null;
    let highestScore = 0;

    for (const item of KNOWLEDGE_BASE) {
      let score = 0;
      for (const token of queryTokens) {
        if (item.keywords.some((k) => k.includes(token) || token.includes(k))) score += 3;
        if (item.topic.toLowerCase().includes(token)) score += 2;
        if (item.content.toLowerCase().includes(token)) score += 1;
        if (item.ruleCode.toLowerCase() === token) score += 5;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    // Also search active validation rules from DB
    const dbRules = await prisma.validationRule.findMany({
      where: {
        OR: [
          { code: { contains: cleanQuery, mode: 'insensitive' } },
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { description: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      take: 2,
    });

    if (highestScore > 1 && bestMatch) {
      return res.json({
        found: true,
        topic: bestMatch.topic,
        section: bestMatch.section,
        ruleCode: bestMatch.ruleCode,
        ruleVersion: bestMatch.ruleVersion,
        explanation: bestMatch.content,
        disclaimer: 'AI Assistance Grounded in AICTE Process Handbook & Validation Rules. Not legal advice.',
        relatedDbRules: dbRules.map((r) => ({ code: r.code, name: r.name, severity: r.severity })),
      });
    }

    if (dbRules.length > 0) {
      const primary = dbRules[0];
      return res.json({
        found: true,
        topic: primary.name,
        section: 'EduTrace Validation Rule Engine',
        ruleCode: primary.code,
        ruleVersion: primary.version,
        explanation: `${primary.name}: ${primary.description}`,
        disclaimer: 'AI Assistance Grounded in AICTE Process Handbook & Validation Rules. Not legal advice.',
        relatedDbRules: dbRules.map((r) => ({ code: r.code, name: r.name, severity: r.severity })),
      });
    }

    // Fallback when no direct rule found
    res.json({
      found: false,
      topic: 'General AICTE Query Assistance',
      section: 'AICTE Handbook General Index',
      ruleCode: 'NONE',
      ruleVersion: '1.0.0',
      explanation: `No specific AICTE rule or validation clause was directly matched for "${query}". You can query topics like: "What is the NRI seat quota?", "How does APAAR duplicate detection work?", "What causes CAP-01 capacity violation?", or "How does OCI supernumerary seat calculation work?".`,
      disclaimer: 'AI Assistance Grounded in AICTE Process Handbook & Validation Rules. Not legal advice.',
      suggestedTopics: [
        'Approved Intake Limits (CAP-01)',
        'NRI & Supernumerary Quotas (CAP-02, CAP-03)',
        'APAAR Identification Standards (FMT-01, FMT-02)',
        'Cross-Institution Duplicate Detection (DUP-02)',
      ],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { queryCopilot };
