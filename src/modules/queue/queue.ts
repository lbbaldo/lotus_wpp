import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../config/env.js";

export type DispatchJobData = {
  messageQueueId: number;
};

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const dispatchQueue = new Queue<DispatchJobData>(env.QUEUE_NAME, {
  connection
});

export const enqueueDispatchJob = async (messageQueueId: number): Promise<void> => {
  await dispatchQueue.add(
    `dispatch-${messageQueueId}`,
    { messageQueueId },
    {
      jobId: `dispatch-${messageQueueId}`,
      removeOnComplete: 500,
      removeOnFail: 1000,
      attempts: env.QUEUE_MAX_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: 5000
      }
    }
  );
};
