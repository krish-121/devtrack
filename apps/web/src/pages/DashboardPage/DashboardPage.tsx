import { taskStatuses } from '@devtrack/shared';
import { Link } from 'react-router';
import { LoadingState } from '../../components/ui/LoadingState';
import { QueryError } from '../../components/ui/QueryError';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import { ProjectProgress } from '../../features/projects/components/ProjectProgress';
import { taskStatusLabels } from '../../features/tasks/task-labels';

export function DashboardPage() {
  const query = useDashboard();
  const summary = query.data;
  const totalTasks = summary
    ? summary.openTaskCount + summary.completedTaskCount
    : 0;
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">See the bigger picture</p>
          <h1>Dashboard</h1>
          <p className="muted">Your projects and progress, in one place.</p>
        </div>
        <Link className="button primary" to="/projects/new">
          New project
        </Link>
      </header>
      {query.isPending ? (
        <LoadingState label="Loading dashboard…" />
      ) : query.isError ? (
        <QueryError
          resource="dashboard"
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        summary && (
          <>
            {query.isFetching && (
              <p role="status" className="field-help">
                Refreshing dashboard…
              </p>
            )}
            <section aria-label="Dashboard metrics">
              <dl className="summary-grid">
                <div className="panel summary-card">
                  <dt>Active projects</dt>
                  <dd>{summary.activeProjectCount}</dd>
                  <dd className="metric-description">
                    Projects you’re building
                  </dd>
                </div>
                <div className="panel summary-card">
                  <dt>Open tasks</dt>
                  <dd>{summary.openTaskCount}</dd>
                  <dd className="metric-description">To do and in progress</dd>
                </div>
                <div className="panel summary-card">
                  <dt>Completed tasks</dt>
                  <dd>{summary.completedTaskCount}</dd>
                  <dd className="metric-description">Work you’ve finished</dd>
                </div>
              </dl>
            </section>
            {summary.activeProjectCount === 0 ? (
              <section className="panel empty-state">
                <p className="eyebrow">A fresh start</p>
                <h2>Your next idea starts here</h2>
                <p>
                  Create a project, add a few tasks, and watch your progress
                  grow.
                </p>
                <Link className="button primary" to="/projects/new">
                  Create your first project
                </Link>
              </section>
            ) : (
              <div className="dashboard-sections">
                <section className="panel" aria-labelledby="task-status-title">
                  <h2 id="task-status-title">Task status</h2>
                  {totalTasks === 0 && (
                    <p className="muted">
                      No tasks yet. Open a project below to add your first task.
                    </p>
                  )}
                  <ul className="status-summary">
                    {taskStatuses.map((status) => (
                      <li key={status}>
                        <div>
                          <span>{taskStatusLabels[status]}</span>
                          <strong>{summary.tasksByStatus[status]}</strong>
                        </div>
                        <div
                          className={`status-track status-${status.toLowerCase()}`}
                          aria-hidden="true"
                        >
                          <span
                            style={{
                              width: `${totalTasks ? (summary.tasksByStatus[status] / totalTasks) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
                <section
                  className="panel"
                  aria-labelledby="recent-projects-title"
                >
                  <div className="section-heading">
                    <h2 id="recent-projects-title">Recent projects</h2>
                    <Link to="/projects">View all projects</Link>
                  </div>
                  <ul className="recent-projects">
                    {summary.recentProjects.map((project) => (
                      <li key={project.id}>
                        <h3>
                          <Link to={`/projects/${project.id}`}>
                            {project.name}
                          </Link>
                        </h3>
                        <ProjectProgress project={project} />
                        <p className="field-help">
                          Updated{' '}
                          <time dateTime={project.updatedAt}>
                            {new Date(project.updatedAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              },
                            )}
                          </time>
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}
          </>
        )
      )}
    </>
  );
}
