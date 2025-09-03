import { BullBoardRequest, ControllerHandlerReturnType, QueueJob } from '../../typings/app';
import { jobProvider } from '../providers/job';
import { queueProvider } from '../providers/queue';
import { BaseAdapter } from '../queueAdapters/base';

async function cleanJob(
  _req: BullBoardRequest,
  job: QueueJob,
  queue: BaseAdapter
): Promise<ControllerHandlerReturnType> {
  if (job.repeatJobKey) {
    await queue.cleanJobScheduler(job.repeatJobKey);
  } else {
    await job.remove();
  }

  return {
    status: 204,
    body: {},
  };
}

export const cleanJobHandler = queueProvider(jobProvider(cleanJob));
