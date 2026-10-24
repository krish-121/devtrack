import { Router } from 'express';
import { getVersion } from './version.controller.js';

export const versionRouter = Router();
versionRouter.get('/', getVersion);
