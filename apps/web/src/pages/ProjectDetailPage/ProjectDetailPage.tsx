import { Link, useParams } from 'react-router';
import { QueryError } from '../../components/ui/QueryError';
import { DeleteProject } from '../../features/projects/components/DeleteProject';
import { ProjectProgress } from '../../features/projects/components/ProjectProgress';
import { useProject } from '../../features/projects/hooks/useProjects';
import { TaskBoard } from '../../features/tasks/components/TaskBoard';
import { LoadingState } from '../../components/ui/LoadingState';
export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const query = useProject(projectId);
  if (query.isPending) return <LoadingState label="Loading project…" />;
  if (query.isError)
    return (
      <>
        <Link className="back-link" to="/projects">
          ← All projects
        </Link>
        <QueryError
          resource="project"
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      </>
    );
  const project = query.data;
  return (
    <>
      <Link className="back-link" to="/projects">
        ← All projects
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Project overview</p>
          <h1>{project.name}</h1>
        </div>
        <Link className="button" to={`/projects/${project.id}/edit`}>
          Edit project
        </Link>
      </header>
      <section className="panel project-overview">
        <h2>About this project</h2>
        <p className="description">
          {project.description || 'No description yet.'}
        </p>
        <ProjectProgress project={project} />
        <p className="muted">
          Created{' '}
          <time dateTime={project.createdAt}>
            {new Date(project.createdAt).toLocaleDateString()}
          </time>{' '}
          · Updated{' '}
          <time dateTime={project.updatedAt}>
            {new Date(project.updatedAt).toLocaleDateString()}
          </time>
        </p>
      </section>
      <TaskBoard key={projectId} projectId={project.id} />
      <div className="project-management">
        <DeleteProject id={project.id} name={project.name} />
      </div>
    </>
  );
}
