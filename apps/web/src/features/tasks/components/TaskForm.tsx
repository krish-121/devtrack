import {
  createTaskSchema,
  taskPriorities,
  taskStatuses,
} from '@devtrack/shared';
import type { CreateTaskInput, TaskDto } from '@devtrack/shared';
import { z } from 'zod';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../../lib/api/client';
import { useFormFocus } from '../../../lib/forms/useFormFocus';
import { taskStatusLabels } from '../task-labels';

export function TaskForm({
  task,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  task?: TaskDto;
  pending: boolean;
  error: Error | null;
  onSubmit: (input: CreateTaskInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus] = useState<string>(task?.status ?? 'TODO');
  const [priority, setPriority] = useState<string>(task?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? '');
  const [validation, setValidation] = useState<Record<string, string>>({});
  const formRef = useFormFocus(error, validation);
  const details = {
    ...(error instanceof ApiError ? error.details : {}),
    ...validation,
  };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const errors: Record<string, string> = {};
    if (dueDate && !z.iso.date().safeParse(dueDate).success)
      errors.dueDate = 'Choose a valid date.';
    const parsed = createTaskSchema.safeParse({
      title,
      description: description.trim() || null,
      status,
      priority,
      dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
    });
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        errors[issue.path.join('.')] ??= issue.message;
    setValidation(errors);
    if (parsed.success && Object.keys(errors).length === 0)
      onSubmit(parsed.data);
  }
  return (
    <form
      ref={formRef}
      className="panel task-form"
      noValidate
      onSubmit={submit}
      aria-busy={pending}
    >
      <h2>{task ? 'Edit task' : 'New task'}</h2>
      {error && (
        <p role="alert" className="error" data-form-error tabIndex={-1}>
          {error.message}
        </p>
      )}
      <div className="field">
        <label htmlFor="task-title">Title (required)</label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          disabled={pending}
          required
          autoFocus
          aria-invalid={Boolean(details.title)}
          aria-describedby={details.title ? 'task-title-error' : undefined}
        />
        {details.title && (
          <p id="task-title-error" role="alert" className="error">
            {details.title}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="task-description">Description (optional)</label>
        <textarea
          id="task-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={5000}
          disabled={pending}
          aria-invalid={Boolean(details.description)}
          aria-describedby={
            details.description ? 'task-description-error' : undefined
          }
        />
        {details.description && (
          <p id="task-description-error" role="alert" className="error">
            {details.description}
          </p>
        )}
      </div>
      <div className="task-form-row">
        <div className="field">
          <label htmlFor="task-status">Status</label>
          <select
            id="task-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={pending}
          >
            {taskStatuses.map((value) => (
              <option key={value} value={value}>
                {taskStatusLabels[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="task-priority">Priority</label>
          <select
            id="task-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            disabled={pending}
          >
            {taskPriorities.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="task-due-date">Due date (optional)</label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={pending}
            aria-invalid={Boolean(details.dueDate)}
            aria-describedby={details.dueDate ? 'task-date-error' : undefined}
          />
          {details.dueDate && (
            <p id="task-date-error" role="alert" className="error">
              {details.dueDate}
            </p>
          )}
        </div>
      </div>
      <div className="actions">
        <button className="button primary" type="submit" disabled={pending}>
          {pending ? 'Saving task…' : task ? 'Save task' : 'Create task'}
        </button>
        <button
          className="button"
          type="button"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
