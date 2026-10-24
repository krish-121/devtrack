import type { ProjectDto, ProjectInput } from '@devtrack/shared';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../../lib/api/client';
import { useFormFocus } from '../../../lib/forms/useFormFocus';

type Props = {
  project?: ProjectDto;
  pending: boolean;
  error: Error | null;
  onSubmit: (input: ProjectInput) => void;
};

export function ProjectForm({ project, pending, error, onSubmit }: Props) {
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
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
    if (!name.trim()) errors.name = 'Project name is required.';
    else if (name.trim().length > 120)
      errors.name = 'Use 120 characters or fewer.';
    if (description.trim().length > 2000)
      errors.description = 'Use 2000 characters or fewer.';
    setValidation(errors);
    if (Object.keys(errors).length === 0)
      onSubmit({ name: name.trim(), description: description.trim() || null });
  }
  return (
    <form
      ref={formRef}
      className="panel project-form"
      onSubmit={submit}
      noValidate
      aria-busy={pending}
    >
      {error && (
        <p role="alert" className="error" data-form-error tabIndex={-1}>
          {error.message}
        </p>
      )}
      <div className="field">
        <label htmlFor="project-name">
          Project name <span className="required">(required)</span>
        </label>
        <input
          id="project-name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          required
          disabled={pending}
          aria-invalid={Boolean(details.name)}
          aria-describedby={details.name ? 'name-error' : 'name-help'}
          autoFocus
        />
        {details.name ? (
          <p id="name-error" className="error" role="alert">
            {details.name}
          </p>
        ) : (
          <p id="name-help" className="field-help">
            Give your project a clear, recognizable name.
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="project-description">
          Description <span className="required">(optional)</span>
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          disabled={pending}
          aria-invalid={Boolean(details.description)}
          aria-describedby={
            details.description ? 'description-error' : 'description-help'
          }
        />
        {details.description ? (
          <p id="description-error" className="error" role="alert">
            {details.description}
          </p>
        ) : (
          <p id="description-help" className="field-help">
            What are you working toward? Up to 2,000 characters.
          </p>
        )}
      </div>
      <div className="actions">
        <button className="button primary" type="submit" disabled={pending}>
          {pending ? 'Saving…' : project ? 'Save changes' : 'Create project'}
        </button>
        {!pending && (
          <Link
            className="button"
            to={project ? `/projects/${project.id}` : '/projects'}
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
