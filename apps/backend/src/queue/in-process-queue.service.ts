import { Injectable, Logger } from '@nestjs/common';

interface QueueItem {
  taskId: string;
}

@Injectable()
export class InProcessQueueService {
  private readonly logger = new Logger(InProcessQueueService.name);
  private queue: QueueItem[] = [];
  private processing = false;
  private processor?: (taskId: string) => Promise<any>;

  setProcessor(fn: (taskId: string) => Promise<any>) {
    this.processor = fn;
  }

  async add(taskId: string): Promise<void> {
    this.logger.log(`Task ${taskId} added to queue (queue size: ${this.queue.length + 1})`);
    this.queue.push({ taskId });
    this.processNext();
  }

  get size(): number {
    return this.queue.length;
  }

  get pending(): number {
    return this.processing ? 1 : 0;
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    if (!this.processor) {
      this.logger.warn('No processor set, skipping queue processing');
      return;
    }

    this.processing = true;
    const item = this.queue.shift()!;

    try {
      this.logger.log(`Processing task: ${item.taskId}`);
      const result = await this.processor(item.taskId);
      this.logger.log(`Task ${item.taskId} finished: ${result?.status || 'done'}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Task ${item.taskId} failed: ${msg}`);
    } finally {
      this.processing = false;
      this.processNext();
    }
  }
}
