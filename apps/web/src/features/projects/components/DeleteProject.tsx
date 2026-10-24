import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDeleteProject } from '../hooks/useProjects';
import { useConfirmationFocus } from '../../../components/ui/useConfirmationFocus';
export function DeleteProject({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const { triggerRef, cancelRef } = useConfirmationFocus(confirming);
  const mutation = useDeleteProject(id);
  const navigate = useNavigate();
  if (!confirming)
    return (
      <button
        ref={triggerRef}
        className="button danger-outline"
        onClick={() => setConfirming(true)}
      >
        Delete project
      </button>
    );
  return (
    <section
      className="delete-confirmation"
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      aria-busy={mutation.isPending}
    >
      <h2 id="delete-title">Delete {name}?</h2>
      <p id="delete-description">
        This permanently deletes the project and all its tasks. This cannot be
        undone.
      </p>
      {mutation.error && (
        <p role="alert" className="error">
          {mutation.error.message}
        </p>
      )}
      <div className="actions">
        <button
          className="button danger"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate(undefined, {
              onSuccess: () => {
                void navigate('/projects');
              },
            })
          }
        >
          {mutation.isPending ? 'Deleting…' : 'Permanently delete project'}
        </button>
        <button
          className="button"
          ref={cancelRef}
          disabled={mutation.isPending}
          onClick={() => {
            setConfirming(false);
            mutation.reset();
          }}
        >
          Keep project
        </button>
      </div>
    </section>
  );
}
