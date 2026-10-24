import type { ProjectInput, UpdateProjectInput } from '@devtrack/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

const projectKeys = {
  all: ['projects'],
  detail: (id: string) => ['projects', id],
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => projectsApi.list(),
  });
}
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.get(id),
  });
}
export function useCreateProject() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsApi.create(input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: projectKeys.all }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}
export function useUpdateProject(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectsApi.update(id, input),
    onSuccess: async (project) => {
      client.setQueryData(projectKeys.detail(id), project);
      await Promise.all([
        client.invalidateQueries({ queryKey: projectKeys.all }),
        client.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}
export function useDeleteProject(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => projectsApi.remove(id),
    onSuccess: async () => {
      client.removeQueries({ queryKey: projectKeys.detail(id), exact: true });
      await Promise.all([
        client.invalidateQueries({ queryKey: ['dashboard'] }),
        client.invalidateQueries({
          queryKey: projectKeys.all,
          exact: true,
        }),
      ]);
    },
  });
}
