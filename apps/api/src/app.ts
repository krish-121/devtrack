import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './modules/health/health.routes.js';
import { versionRouter } from './modules/version/version.routes.js';
import { projectRouter } from './modules/projects/project.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { browserSecurity } from './middleware/browser-security.js';
import { taskRouter } from './modules/tasks/task.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { extname, join, sep } from 'node:path';
import { env } from './config/env.js';
import { requestLogging } from './middleware/request-logging.js';

// Tests import the API alone; the compiled server also supplies its web assets.
export function createApp(webDirectory?: string) {
  const app = express();

  app.disable('x-powered-by');
  // Trust a bounded proxy chain only when the deployment explicitly enables it.
  app.set('trust proxy', env.trustProxyHops);
  app.use('/api', requestLogging);
  app.use(helmet());
  app.use(express.json({ limit: '16kb' }));
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/version', versionRouter);
  app.use('/api/v1/auth', browserSecurity, authRouter);
  app.use('/api/v1/projects', browserSecurity, projectRouter);
  app.use('/api/v1/tasks', browserSecurity, taskRouter);
  app.use('/api/v1/dashboard', browserSecurity, dashboardRouter);
  // API mistakes must stay JSON 404s, never the frontend's index.html.
  app.use('/api', notFoundHandler);
  if (webDirectory) {
    app.use(
      express.static(webDirectory, {
        index: false,
        setHeaders(response, filePath) {
          response.setHeader(
            'Cache-Control',
            filePath.startsWith(join(webDirectory, 'assets') + sep)
              ? 'public, max-age=31536000, immutable'
              : 'no-cache',
          );
        },
      }),
    );
    app.get('/{*path}', (request, response, next) => {
      if (
        !request.accepts('html') ||
        extname(request.path) ||
        request.path.startsWith('/assets/') ||
        request.path.split('/').some((segment) => segment.startsWith('.'))
      ) {
        next();
        return;
      }
      response.setHeader('Cache-Control', 'no-cache');
      response.sendFile('index.html', { root: webDirectory });
    });
  }
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
