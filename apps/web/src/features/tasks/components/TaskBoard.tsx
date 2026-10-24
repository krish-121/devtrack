import {
  taskFilterSchema,
  taskPriorities,
  taskStatusSchema,
  taskStatuses,
} from '@devtrack/shared';
import type { TaskDto } from '@devtrack/shared';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { QueryError } from '../../../components/ui/QueryError';
import { useTaskMutations, useTasks } from '../hooks/useTasks';
import { TaskForm } from './TaskForm';
import { LoadingState } from '../../../components/ui/LoadingState';
import { useConfirmationFocus } from '../../../components/ui/useConfirmationFocus';
import { taskStatusLabels } from '../task-labels';

function TaskCard({
  task,
  projectId,
  onEdit,
}: {
  task: TaskDto;
  projectId: string;
  onEdit: (task: TaskDto) => void;
}) {
  const mutation = useTaskMutations(projectId);
  const [confirming, setConfirming] = useState(false);
  const { triggerRef, cancelRef } = useConfirmationFocus(confirming);
  const pending = mutation.update.isPending || mutation.remove.isPending;
  return (
    <article className="task-card">
      <h4>{task.title}</h4>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-meta">
        <span className={`priority priority-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <time dateTime={task.dueDate}>
            Due{' '}
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              timeZone: 'UTC',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        )}
      </div>
      <label className="field-help" htmlFor={`status-${task.id}`}>
        Status for {task.title}
      </label>
      <select
        id={`status-${task.id}`}
        value={task.status}
        disabled={mutation.update.isPending || mutation.remove.isPending}
        onChange={(event) =>
          mutation.update.mutate({
            id: task.id,
            input: { status: taskStatusSchema.parse(event.target.value) },
          })
        }
      >
        {taskStatuses.map((status) => (
          <option key={status} value={status}>
            {taskStatusLabels[status]}
          </option>
        ))}
      </select>
      {mutation.update.isPending && (
        <p role="status" className="field-help">
          Updating status…
        </p>
      )}
      {mutation.update.error && (
        <p role="alert" className="error">
          {mutation.update.error.message}
        </p>
      )}
      {mutation.remove.error && (
        <p role="alert" className="error">
          {mutation.remove.error.message}
        </p>
      )}
      {confirming ? (
        <div
          className="task-delete"
          role="group"
          aria-labelledby={`delete-task-${task.id}`}
          aria-busy={mutation.remove.isPending}
        >
          <p id={`delete-task-${task.id}`}>
            Delete “{task.title}” permanently?
          </p>
          <div className="actions">
            <button
              className="button danger"
              disabled={mutation.remove.isPending}
              onClick={() => mutation.remove.mutate(task.id)}
            >
              {mutation.remove.isPending
                ? 'Deleting task…'
                : 'Confirm delete task'}
            </button>
            <button
              ref={cancelRef}
              className="button"
              disabled={mutation.remove.isPending}
              onClick={() => setConfirming(false)}
            >
              Keep task
            </button>
          </div>
        </div>
      ) : (
        <div className="actions task-actions">
          <button
            className="button"
            disabled={pending}
            onClick={() => onEdit(task)}
          >
            Edit task
          </button>
          <button
            ref={triggerRef}
            className="button danger-outline"
            disabled={pending}
            onClick={() => setConfirming(true)}
          >
            Delete task
          </button>
        </div>
      )}
    </article>
  );
}

export function TaskBoard({ projectId }: { projectId: string }) {
  const [params, setParams] = useSearchParams();
  const parsed = taskFilterSchema.safeParse(
    Object.fromEntries(
      ['status', 'priority', 'q'].flatMap((key) =>
        params.get(key) ? [[key, params.get(key)]] : [],
      ),
    ),
  );
  const filters = parsed.success ? parsed.data : {};
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchRef.current) searchRef.current.value = filters.q ?? '';
  }, [filters.q]);
  const [editing, setEditing] = useState<TaskDto | 'new' | null>(null);
  const query = useTasks(projectId, filters);
  const mutation = useTaskMutations(projectId);
  const newTaskRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  const formPending = mutation.create.isPending || mutation.update.isPending;
  useEffect(() => {
    if (editing) wasEditing.current = true;
    else if (wasEditing.current && !formPending) {
      newTaskRef.current?.focus();
      wasEditing.current = false;
    }
  }, [editing, formPending]);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  function edit(task: TaskDto) {
    mutation.update.reset();
    setEditing(task);
  }
  return (
    <section className="tasks-section" aria-labelledby="tasks-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Move your work forward</p>
          <h2 id="tasks-title">Tasks</h2>
        </div>
        <button
          id="new-task"
          ref={newTaskRef}
          className="button primary"
          disabled={formPending}
          onClick={() => {
            mutation.create.reset();
            setEditing('new');
          }}
        >
          New task
        </button>
      </div>
      {editing && (
        <TaskForm
          key={editing === 'new' ? 'new' : editing.id}
          {...(editing === 'new' ? {} : { task: editing })}
          pending={formPending}
          error={
            editing === 'new' ? mutation.create.error : mutation.update.error
          }
          onCancel={() => setEditing(null)}
          onSubmit={(input) => {
            if (editing === 'new')
              mutation.create.mutate(input, {
                onSuccess: () => setEditing(null),
              });
            else
              mutation.update.mutate(
                { id: editing.id, input },
                { onSuccess: () => setEditing(null) },
              );
          }}
        />
      )}
      <div className="task-filters">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const search = new FormData(event.currentTarget).get('q');
            filter('q', typeof search === 'string' ? search.trim() : '');
          }}
        >
          <label htmlFor="task-search">Search tasks</label>
          <div className="search-controls">
            <input
              id="task-search"
              ref={searchRef}
              name="q"
              type="search"
              defaultValue={filters.q ?? ''}
              maxLength={200}
              placeholder="Title or description"
            />
            <button className="button" type="submit">
              Search
            </button>
          </div>
        </form>
        <div>
          <label htmlFor="status-filter">Filter by status</label>
          <select
            id="status-filter"
            value={filters.status ?? ''}
            onChange={(event) => filter('status', event.target.value)}
          >
            <option value="">All statuses</option>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="priority-filter">Filter by priority</label>
          <select
            id="priority-filter"
            value={filters.priority ?? ''}
            onChange={(event) => filter('priority', event.target.value)}
          >
            <option value="">All priorities</option>
            {taskPriorities.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </div>
        <button
          className="button"
          onClick={() => {
            setParams({});
          }}
        >
          Clear filters
        </button>
      </div>
      {query.isPending ? (
        <LoadingState label="Loading tasks…" />
      ) : query.isError ? (
        <QueryError
          resource="tasks"
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : query.data.length === 0 ? (
        <div className="panel empty-state">
          <h3>
            {Object.values(filters).some(Boolean)
              ? 'No tasks match these filters'
              : 'No tasks yet'}
          </h3>
          <p>
            {Object.values(filters).some(Boolean)
              ? 'Try another search or clear the filters.'
              : 'Create a task to take the first step.'}
          </p>
          <button
            className="button"
            disabled={formPending}
            onClick={() => {
              if (Object.values(filters).some(Boolean)) setParams({});
              else {
                mutation.create.reset();
                setEditing('new');
              }
            }}
          >
            {Object.values(filters).some(Boolean)
              ? 'Show all tasks'
              : 'Create your first task'}
          </button>
        </div>
      ) : (
        <div className="task-board">
          {taskStatuses.map((status) => (
            <section className="task-column" key={status}>
              <h3>
                {taskStatusLabels[status]}{' '}
                <span>
                  {query.data.filter((task) => task.status === status).length}
                </span>
              </h3>
              {query.data
                .filter((task) => task.status === status)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectId={projectId}
                    onEdit={edit}
                  />
                ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
