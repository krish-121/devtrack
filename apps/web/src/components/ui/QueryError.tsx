import { Link } from 'react-router';
import { ApiError } from '../../lib/api/client';

export function QueryError({
  error,
  retry,
  resource = 'page',
}: {
  error: Error;
  retry: () => void;
  resource?: string;
}) {
  const missing =
    (resource === 'project' || resource === 'tasks') &&
    error instanceof ApiError &&
    (error.status === 404 ||
      (error.status === 400 && error.code === 'VALIDATION_ERROR'));
  return (
    <div className="panel" role="alert">
      <h2>
        {missing
          ? 'This project is unavailable'
          : `Could not load ${resource === 'page' ? 'this page' : `your ${resource}`}`}
      </h2>
      <p>
        {missing
          ? 'It may have been deleted, or you may not have access to it.'
          : error.message}
      </p>
      {missing ? (
        <Link className="button" to="/projects">
          Back to projects
        </Link>
      ) : (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
