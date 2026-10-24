import { Link } from 'react-router';
import { QueryError } from '../../components/ui/QueryError';
import { ProjectProgress } from '../../features/projects/components/ProjectProgress';
import { useProjects } from '../../features/projects/hooks/useProjects';
import { LoadingState } from '../../components/ui/LoadingState';
export function ProjectsPage() {
  const query = useProjects();
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>Projects</h1>
          <p className="muted">A clear view of what you’re building.</p>
        </div>
        <Link className="button primary" to="/projects/new">
          New project
        </Link>
      </header>
      {query.isPending ? (
        <LoadingState label="Loading projects…" />
      ) : query.isError ? (
        <QueryError
          resource="projects"
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : query.data.length === 0 ? (
        <div className="panel empty-state">
          <p className="eyebrow">A fresh start</p>
          <h2>Your next idea starts here</h2>
          <p>Create your first project to give your work a home.</p>
          <Link className="button primary" to="/projects/new">
            Create your first project
          </Link>
        </div>
      ) : (
        <>
          <p className="list-summary">
            {query.data.length}{' '}
            {query.data.length === 1 ? 'project' : 'projects'}
          </p>
          <div className="project-grid">
            {query.data.map((project) => (
              <article className="panel project-card" key={project.id}>
                <div className="card-heading">
                  <span className="project-icon" aria-hidden="true">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                  <h2>
                    <Link to={`/projects/${project.id}`}>{project.name}</Link>
                  </h2>
                </div>
                <p className="card-description">
                  {project.description || 'No description yet.'}
                </p>
                <ProjectProgress project={project} />
                <footer className="card-footer">
                  <span>
                    Updated{' '}
                    <time dateTime={project.updatedAt}>
                      {new Date(project.updatedAt).toLocaleDateString(
                        undefined,
                        { month: 'short', day: 'numeric', year: 'numeric' },
                      )}
                    </time>
                  </span>
                  <Link
                    to={`/projects/${project.id}/edit`}
                    aria-label={`Edit ${project.name}`}
                  >
                    Edit
                  </Link>
                </footer>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
