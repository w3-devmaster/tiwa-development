import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { InProcessQueueService } from '../queue/in-process-queue.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

export interface WorkflowStep {
  name: string;
  label: string;
  role: string;
  type: string;
}

export const DEFAULT_WORKFLOW_STEPS: WorkflowStep[] = [
  { name: 'planner', label: 'Planner', role: 'planner', type: 'plan' },
  { name: 'architect', label: 'Architect', role: 'architect', type: 'design' },
  { name: 'builder', label: 'Builder', role: 'builder', type: 'code' },
  { name: 'tester', label: 'Tester', role: 'tester', type: 'test' },
  { name: 'reviewer', label: 'Reviewer', role: 'reviewer', type: 'review' },
  { name: 'devops', label: 'DevOps', role: 'devops', type: 'deploy' },
];

const MAX_REVIEW_RETRIES = 3;
const BUILDER_STEP_INDEX = 2;

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private queue: InProcessQueueService,
  ) {}

  private parseJsonFields(workflow: any) {
    if (!workflow) return workflow;
    const parse = (v: any) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
    return { ...workflow, stepsJson: parse(workflow.stepsJson) };
  }

  async findAll() {
    const workflows = await this.prisma.workflow.findMany({
      include: { project: true },
      orderBy: { updatedAt: 'desc' },
    });
    return workflows.map((w) => this.parseJsonFields(w));
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { project: true, tasks: true },
    });
    if (!workflow) throw new NotFoundException(`Workflow ${id} not found`);
    return this.parseJsonFields(workflow);
  }

  async create(dto: CreateWorkflowDto) {
    const steps = dto.stepsJson?.length ? dto.stepsJson : DEFAULT_WORKFLOW_STEPS;
    return this.prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        projectId: dto.projectId,
        stepsJson: JSON.stringify(steps),
        currentStepIndex: dto.currentStepIndex || 0,
      },
      include: { project: true },
    });
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.stepsJson !== undefined) data.stepsJson = JSON.stringify(dto.stepsJson);
    if (dto.currentStepIndex !== undefined) data.currentStepIndex = dto.currentStepIndex;
    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'running') data.startedAt = new Date();
      if (['completed', 'failed', 'cancelled'].includes(dto.status))
        data.completedAt = new Date();
    }
    return this.prisma.workflow.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.workflow.delete({ where: { id } });
  }

  // ========== Workflow Execution Engine ==========

  /**
   * Start a workflow — sets status to 'running' and creates the first task (Planner).
   */
  async startWorkflow(workflowId: string): Promise<void> {
    const workflow = await this.findOne(workflowId);
    const steps: WorkflowStep[] = workflow.stepsJson || DEFAULT_WORKFLOW_STEPS;

    if (steps.length === 0) {
      throw new Error('Workflow has no steps');
    }

    // Update workflow to running
    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: 'running',
        currentStepIndex: 0,
        startedAt: new Date(),
        stepsJson: JSON.stringify(steps),
      },
    });

    this.events.emitWorkflowUpdate({ id: workflowId, status: 'running', currentStepIndex: 0 });

    // Create and queue the first task
    await this.createTaskForStep(workflowId, steps[0], workflow.projectId);
    this.logger.log(`Workflow ${workflowId} started — first step: ${steps[0].label}`);
  }

  /**
   * Advance to the next step after a task completes.
   * Handles reviewer branching logic (approved → devops, needs_revision → builder).
   */
  async advanceStep(workflowId: string, completedTaskResult: string): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { tasks: true },
    });

    if (!workflow || workflow.status !== 'running') return;

    const steps: WorkflowStep[] = (() => {
      try {
        const parsed = typeof workflow.stepsJson === 'string'
          ? JSON.parse(workflow.stepsJson)
          : workflow.stepsJson;
        return Array.isArray(parsed) ? parsed : DEFAULT_WORKFLOW_STEPS;
      } catch {
        return DEFAULT_WORKFLOW_STEPS;
      }
    })();

    const currentIndex = workflow.currentStepIndex;
    const currentStep = steps[currentIndex];

    if (!currentStep) {
      this.logger.warn(`Workflow ${workflowId}: invalid step index ${currentIndex}`);
      return;
    }

    let nextIndex: number;

    // Reviewer branching logic
    if (currentStep.name === 'reviewer') {
      const reviewStatus = this.parseReviewerStatus(completedTaskResult);

      if (reviewStatus === 'approved') {
        nextIndex = currentIndex + 1;
        this.logger.log(`Workflow ${workflowId}: Reviewer approved — advancing to DevOps`);
      } else {
        // Count how many times we've looped back to builder
        const builderTasks = workflow.tasks.filter((t) => t.type === 'code');
        const retryCount = builderTasks.length; // includes the original attempt

        if (retryCount >= MAX_REVIEW_RETRIES) {
          this.logger.warn(`Workflow ${workflowId}: Max retries (${MAX_REVIEW_RETRIES}) reached — failing workflow`);
          await this.prisma.workflow.update({
            where: { id: workflowId },
            data: { status: 'failed', completedAt: new Date() },
          });
          this.events.emitWorkflowUpdate({ id: workflowId, status: 'failed' });
          return;
        }

        nextIndex = BUILDER_STEP_INDEX;
        this.logger.log(
          `Workflow ${workflowId}: Reviewer needs_revision — looping back to Builder (retry ${retryCount}/${MAX_REVIEW_RETRIES})`,
        );
      }
    } else {
      nextIndex = currentIndex + 1;
    }

    // Check if workflow is complete
    if (nextIndex >= steps.length) {
      await this.prisma.workflow.update({
        where: { id: workflowId },
        data: { status: 'completed', completedAt: new Date(), currentStepIndex: nextIndex },
      });
      this.events.emitWorkflowUpdate({ id: workflowId, status: 'completed', currentStepIndex: nextIndex });
      this.logger.log(`Workflow ${workflowId} completed!`);
      return;
    }

    // Advance to next step
    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: { currentStepIndex: nextIndex },
    });
    this.events.emitWorkflowUpdate({ id: workflowId, status: 'running', currentStepIndex: nextIndex });

    // Create and queue the next task
    const nextStep = steps[nextIndex];
    await this.createTaskForStep(workflowId, nextStep, workflow.projectId, completedTaskResult);
    this.logger.log(`Workflow ${workflowId}: advancing to step ${nextIndex} — ${nextStep.label}`);
  }

  /**
   * Parse the reviewer's output to determine approved vs needs_revision.
   */
  private parseReviewerStatus(resultContent: string): 'approved' | 'needs_revision' {
    if (!resultContent) return 'needs_revision';

    // Try JSON parse first
    try {
      const parsed = JSON.parse(resultContent);
      if (parsed.status === 'approved') return 'approved';
      if (parsed.status === 'needs_revision') return 'needs_revision';
    } catch {
      // Not JSON — fall through to text search
    }

    // Fallback: search for keywords in raw text
    const lower = resultContent.toLowerCase();
    if (lower.includes('"status": "approved"') || lower.includes('"approved"')) {
      return 'approved';
    }

    return 'needs_revision';
  }

  /**
   * Create a task for a workflow step and queue it for execution.
   */
  private async createTaskForStep(
    workflowId: string,
    step: WorkflowStep,
    projectId: string,
    previousResult?: string,
  ): Promise<void> {
    const description = previousResult
      ? `Auto-generated from workflow step: ${step.label}\n\nContext from previous step:\n${previousResult.substring(0, 2000)}`
      : `Auto-generated from workflow step: ${step.label}`;

    const task = await this.prisma.task.create({
      data: {
        title: `[${step.label}] Workflow Task`,
        description,
        type: step.type,
        status: 'queued',
        priority: 'medium',
        workflowId,
        projectId,
      },
    });

    this.events.emitTaskUpdate({ id: task.id, status: 'queued' });
    await this.queue.add(task.id);
  }
}
