// Jest setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_purposes_only';
process.env.APAAR_HMAC_SECRET = 'test_hmac_secret_for_testing_purposes_only';
process.env.APAAR_ENCRYPTION_KEY = Buffer.from('01234567890123456789012345678901').toString('base64');
