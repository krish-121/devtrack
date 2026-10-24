import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createApp } from './app.js';

let directory = '';
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'devtrack-static-'));
  await mkdir(join(directory, 'assets'));
  await writeFile(
    join(directory, 'index.html'),
    '<!doctype html><div id="root">App shell</div>',
  );
  await writeFile(
    join(directory, 'assets', 'app-hashed.js'),
    'console.log("asset");',
  );
});
afterAll(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

it('serves the SPA for direct frontend navigation without caching its entry point', async () => {
  for (const path of [
    '/',
    '/dashboard',
    '/projects/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  ]) {
    const response = await request(createApp(directory))
      .get(path)
      .accept('html')
      .expect(200);
    expect(response.text).toContain('App shell');
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers['content-security-policy']).toContain(
      "default-src 'self'",
    );
  }
});
it('serves fingerprinted assets with immutable caching', async () => {
  const response = await request(createApp(directory))
    .get('/assets/app-hashed.js')
    .expect(200);
  expect(response.headers['cache-control']).toBe(
    'public, max-age=31536000, immutable',
  );
});
it('keeps missing APIs, missing files, and non-HTML requests out of the SPA fallback', async () => {
  for (const path of [
    '/api/v1/missing',
    '/api/missing',
    '/assets/missing.js',
    '/favicon.ico',
  ])
    await request(createApp(directory))
      .get(path)
      .accept('html')
      .expect('Content-Type', /json/)
      .expect(404);
  await request(createApp(directory))
    .get('/dashboard')
    .accept('json')
    .expect(404);
  await request(createApp(directory)).post('/dashboard').expect(404);
});
it('preserves API health and never exposes arbitrary filesystem files', async () => {
  await request(createApp(directory))
    .get('/api/v1/health')
    .expect(200, { data: { status: 'ok' } });
  await request(createApp(directory)).get('/.env').expect(404);
});
