require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const prisma = require('./utils/prisma');

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connection established successfully');
  } catch (err) {
    logger.warn({ err: err.message }, 'Database connection deferred or failed — check DATABASE_URL in .env');
  }

  const server = app.listen(PORT, () => {
    logger.info(`EduTrace Server running on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
    logger.info(`Mode: ${process.env.INTEGRATION_MODE || 'SIMULATED'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Closing HTTP server and database pool...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('EduTrace Server cleanly stopped');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main();
