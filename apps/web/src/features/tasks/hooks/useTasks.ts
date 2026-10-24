import type {
  CreateTaskInput,
  TaskFilters,
  UpdateTaskInput,
} from '@devtrack/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks.api';

export function useTasks(projectId: string, filters: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: () => tasksApi.list(projectId, filters),
  });
}
export function useTask(id: string) {
  return useQuery({ queryKey: ['task', id], queryFn: () => tasksApi.get(id) });
}
export function useTaskMutations(projectId: string) {
  const client = useQueryClient();
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['tasks', projectId] }),
      client.invalidateQueries({ queryKey: ['projects'] }),
      client.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  }
  const create = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(projectId, input),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      tasksApi.update(id, input),
    onSuccess: async (task) => {
      client.setQueryData(['task', task.id], task);
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: async (_result, id) => {
      client.removeQueries({ queryKey: ['task', id], exact: true });
      await refresh();
    },
  });
  return { create, update, remove };
}
