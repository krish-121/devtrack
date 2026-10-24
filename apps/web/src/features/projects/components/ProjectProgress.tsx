import type { ProjectDto } from '@devtrack/shared';
export function ProjectProgress({ project }: { project: ProjectDto }) {
  return (
    <div className="project-progress">
      <div className="progress-label">
        <span>
          {project.completedTaskCount} of {project.taskCount} tasks complete
        </span>
        <strong>{project.progress}%</strong>
      </div>
      <progress
        value={project.progress}
        max={100}
        aria-label={`${project.name} completion`}
      >
        {project.progress}%
      </progress>
    </div>
  );
}
