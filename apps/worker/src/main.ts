import { Worker } from 'bullmq';
import { QUEUE_NAMES, DEFAULT_WORKER_CONCURRENCY } from '@tiwa/shared';
import { processJob } from './processor.js';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const concurrency = parseInt(
  process.env.WORKER_CONCURRENCY || String(DEFAULT_WORKER_CONCURRENCY),
  10,
);

const connection = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null,
};

const worker = new Worker(QUEUE_NAMES.TASK, processJob, {
  connection,
  concurrency,
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on('ready', () => {
  console.log(`Tiwa Worker ready — listening on queue "${QUEUE_NAMES.TASK}" (concurrency: ${concurrency})`);
});

async function shutdown() {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
