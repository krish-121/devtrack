import type {
  ProjectDto,
  ProjectInput,
  UpdateProjectInput,
} from '@devtrack/shared';
import { AppError } from '../../errors/app-error.js';
import * as repository from './project.repository.js';
import { toProjectDtos } from './project.mapper.js';

function notFound() {
  return new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
}

async function toDtos(
  ownerId: string,
  records: repository.ProjectRecord[],
): Promise<ProjectDto[]> {
  const groups = await repository.countTasksByStatus(
    ownerId,
    records.map((record) => record.id),
  );
  return toProjectDtos(records, groups);
}

async function toDto(
  ownerId: string,
  record: repository.ProjectRecord,
): Promise<ProjectDto> {
  const [project] = await toDtos(ownerId, [record]);
  if (!project) throw new Error('Project serialization failed.');
  return project;
}

export async function listProjects(ownerId: string) {
  return toDtos(ownerId, await repository.listProjects(ownerId));
}

export async function getProject(ownerId: string, id: string) {
  const project = await repository.findProject(ownerId, id);
  if (!project) throw notFound();
  return toDto(ownerId, project);
}

export async function createProject(ownerId: string, input: ProjectInput) {
  return toDto(ownerId, await repository.createProject(ownerId, input));
}

export async function updateProject(
  ownerId: string,
  id: string,
  input: UpdateProjectInput,
) {
  const project = await repository.updateProject(ownerId, id, input);
  if (!project) throw notFound();
  return toDto(ownerId, project);
}

export async function deleteProject(ownerId: string, id: string) {
  const result = await repository.deleteProject(ownerId, id);
  if (result.count === 0) throw notFound();
}
