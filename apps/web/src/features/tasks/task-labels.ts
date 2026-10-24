import type { TaskStatus } from '@devtrack/shared';

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};
