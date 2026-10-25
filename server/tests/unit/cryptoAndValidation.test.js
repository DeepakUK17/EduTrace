const {
  validateApaarFormat,
  generateApaarHmac,
  maskApaar,
  encryptApaar,
  decryptApaar,
  generateVerificationTokenRef,
  hashTokenRef,
} = require('../../src/utils/crypto');

describe('Crypto & APAAR Utilities Unit Tests', () => {
  describe('APAAR Format Validation', () => {
    test('validates standard 12-digit numeric APAAR', () => {
      const res = validateApaarFormat('123456789012');
      expect(res.valid).toBe(true);
      expect(res.isDemoMode).toBe(false);
    });

    test('validates DEMO-APAAR synthetic format', () => {
      const res = validateApaarFormat('DEMO-APAAR-000001');
      expect(res.valid).toBe(true);
      expect(res.isDemoMode).toBe(true);
    });

    test('rejects non-numeric string of wrong length', () => {
      const res = validateApaarFormat('12345ABC');
      expect(res.valid).toBe(false);
    });

    test('rejects null or empty value', () => {
      expect(validateApaarFormat(null).valid).toBe(false);
      expect(validateApaarFormat('').valid).toBe(false);
    });
  });

  describe('HMAC Token Generation & Masking', () => {
    test('generates deterministic HMAC for the same identifier', () => {
      const hmac1 = generateApaarHmac('123456789012');
      const hmac2 = generateApaarHmac('123456789012');
      expect(hmac1).toBe(hmac2);
      expect(typeof hmac1).toBe('string');
      expect(hmac1.length).toBe(64); // SHA-256 hex
    });

    test('masks APAAR ID properly for display', () => {
      const masked = maskApaar('123456789012');
      expect(masked).toBe('****89012');

      const maskedDemo = maskApaar('DEMO-APAAR-000001');
      expect(maskedDemo.endsWith('01')).toBe(true);
      expect(maskedDemo.startsWith('DEMO-APAAR-')).toBe(true);
    });
  });

  describe('Reversible Encryption', () => {
    test('encrypts and decrypts APAAR correctly', () => {
      const raw = '123456789012';
      const encrypted = encryptApaar(raw);
      expect(encrypted).not.toBe(raw);
      const decrypted = decryptApaar(encrypted);
      expect(decrypted).toBe(raw);
    });
  });

  describe('Verification Token References', () => {
    test('generates opaque token reference and sha256 lookup hash', () => {
      const ref = generateVerificationTokenRef();
      expect(typeof ref).toBe('string');
      const hash = hashTokenRef(ref);
      expect(hash).toHaveLength(64);
    });
  });
});
