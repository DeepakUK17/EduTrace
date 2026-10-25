const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Get key from environment - must be 32 bytes (base64 encoded)
function getKey() {
  const key = process.env.APAAR_ENCRYPTION_KEY;
  if (!key) throw new Error('APAAR_ENCRYPTION_KEY environment variable is not set');
  const buf = Buffer.from(key, 'base64');
  if (buf.length < 32) throw new Error('APAAR_ENCRYPTION_KEY must be at least 32 bytes (base64 encoded)');
  return buf.slice(0, 32);
}

function getHmacSecret() {
  const secret = process.env.APAAR_HMAC_SECRET;
  if (!secret) throw new Error('APAAR_HMAC_SECRET environment variable is not set');
  return secret;
}

/**
 * Encrypt APAAR ID for secure storage.
 * Returns base64-encoded iv:ciphertext
 */
function encryptApaar(plaintext) {
  if (!plaintext) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt stored APAAR ID.
 */
function decryptApaar(ciphertext) {
  if (!ciphertext) return null;
  const [ivHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate HMAC token for duplicate matching.
 * Same APAAR ID always produces same token - safe for comparison.
 */
function generateApaarHmac(apaarId) {
  if (!apaarId) return null;
  return crypto
    .createHmac('sha256', getHmacSecret())
    .update(apaarId.trim().toUpperCase())
    .digest('hex');
}

/**
 * Mask APAAR ID for display.
 * DEMO-APAAR-000001 → DEMO-APAAR-****01
 * 123456789012 → ****89012
 */
function maskApaar(apaarId) {
  if (!apaarId) return null;
  if (apaarId.startsWith('DEMO-APAAR-')) {
    const suffix = apaarId.slice(-2);
    return `DEMO-APAAR-****${suffix}`;
  }
  if (/^\d{12}$/.test(apaarId)) {
    return `****${apaarId.slice(-5)}`;
  }
  return `****${apaarId.slice(-4)}`;
}

/**
 * Validate APAAR identifier format.
 * Accepts official 12-digit format OR DEMO-APAAR-XXXXXX synthetic format.
 */
function validateApaarFormat(apaarId) {
  if (!apaarId) return { valid: false, isDemoMode: false, reason: 'MISSING' };

  // Demo format: DEMO-APAAR-000001 to DEMO-APAAR-999999
  if (/^DEMO-APAAR-\d{6}$/.test(apaarId)) {
    return { valid: true, isDemoMode: true, reason: null };
  }

  // Official format: exactly 12 digits
  if (/^\d{12}$/.test(apaarId)) {
    return { valid: true, isDemoMode: false, reason: null };
  }

  return { valid: false, isDemoMode: false, reason: 'INVALID_FORMAT' };
}

/**
 * Generate a secure random token reference for verification QR codes.
 */
function generateVerificationTokenRef() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token reference for secure DB storage.
 */
function hashTokenRef(tokenRef) {
  return crypto.createHash('sha256').update(tokenRef).digest('hex');
}

/**
 * Generate a file hash for idempotency checks on imports.
 */
function hashFile(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  encryptApaar,
  decryptApaar,
  generateApaarHmac,
  maskApaar,
  validateApaarFormat,
  generateVerificationTokenRef,
  hashTokenRef,
  hashFile,
};
