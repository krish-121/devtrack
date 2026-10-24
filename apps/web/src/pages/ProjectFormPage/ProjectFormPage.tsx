import { Link, useNavigate, useParams } from 'react-router';
import { QueryError } from '../../components/ui/QueryError';
import { ProjectForm } from '../../features/projects/components/ProjectForm';
import { LoadingState } from '../../components/ui/LoadingState';
import {
  useCreateProject,
  useProject,
  useUpdateProject,
} from '../../features/projects/hooks/useProjects';
export function CreateProjectPage() {
  const mutation = useCreateProject();
  const navigate = useNavigate();
  return (
    <>
      <Link className="back-link" to="/projects">
        ← All projects
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Make room for an idea</p>
          <h1>New project</h1>
        </div>
      </header>
      <ProjectForm
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(input) =>
          mutation.mutate(input, {
            onSuccess: (project) => {
              void navigate(`/projects/${project.id}`);
            },
          })
        }
      />
    </>
  );
}
export function EditProjectPage() {
  const { projectId = '' } = useParams();
  const query = useProject(projectId);
  const mutation = useUpdateProject(projectId);
  const navigate = useNavigate();
  if (query.isPending) return <LoadingState label="Loading project…" />;
  if (query.isError)
    return (
      <QueryError
        resource="project"
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  return (
    <>
      <Link className="back-link" to={`/projects/${projectId}`}>
        ← Back to project
      </Link>
      <header className="page-header">
        <div>
          <p className="eyebrow">Project settings</p>
          <h1>Edit project</h1>
        </div>
      </header>
      <ProjectForm
        key={projectId}
        project={query.data}
        pending={mutation.isPending}
        error={mutation.error}
        onSubmit={(input) =>
          mutation.mutate(input, {
            onSuccess: () => {
              void navigate(`/projects/${projectId}`);
            },
          })
        }
      />
    </>
  );
}
