import type { LoginInput, RegisterInput, UserDto } from '@devtrack/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const currentUserKey = ['auth', 'me'];
export async function replaceSession(
  client: QueryClient,
  user: UserDto | null,
) {
  await client.cancelQueries();
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  client.getMutationCache().clear();
  client.setQueryData(currentUserKey, user);
}
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 30_000,
  });
}
export function useSignIn(mode: 'login' | 'register') {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput | RegisterInput) =>
      mode === 'register' && 'name' in input
        ? authApi.register(input)
        : authApi.login(input),
    onSuccess: async (user: UserDto) => {
      await replaceSession(client, user);
    },
  });
}
export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      await replaceSession(client, null);
    },
  });
}
