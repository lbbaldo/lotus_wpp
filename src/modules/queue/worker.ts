import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { logger } from "../../shared/logger/logger.js";
import { dispatchMessageQueueItem } from "../messaging/dispatcher.service.js";
import type { DispatchJobData } from "./queue.js";

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const worker = new Worker<DispatchJobData>(
  env.QUEUE_NAME,
  async (job) => {
    await dispatchMessageQueueItem(job.data.messageQueueId);
    logger.info({ messageQueueId: job.data.messageQueueId, jobId: job.id }, "dispatch_success");
  },
  {
    connection,
    concurrency: 10
  }
);

worker.on("failed", (job, error) => {
  logger.error(
    {
      messageQueueId: job?.data.messageQueueId,
      jobId: job?.id,
      error
    },
    "dispatch_failed"
  );
});

worker.on("error", (error) => {
  logger.error({ error }, "worker_error");
});
