import { AsyncLocalStorage } from 'node:async_hooks';

// The context follows this request's async work without changing every service
// and repository signature. It contains no credentials or request payload.
export const requestContext = new AsyncLocalStorage<{ requestId: string }>();
