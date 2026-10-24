import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { apiClient } from './client';

describe('shared HTTP client', () => {
  it('rejects malformed success data instead of trusting a TypeScript cast', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ unexpected: true })),
    );
    await expect(
      apiClient.request('/projects', z.object({ data: z.array(z.string()) })),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });
  it('handles non-JSON server failures without exposing raw HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<html>Proxy failure</html>', { status: 502 }),
        ),
    );
    await expect(
      apiClient.request('/projects', z.unknown()),
    ).rejects.toMatchObject({ code: 'REQUEST_FAILED', status: 502 });
  });
  it('handles 204 deletion without parsing JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );
    await expect(
      apiClient.remove('/projects/example'),
    ).resolves.toBeUndefined();
  });
});
