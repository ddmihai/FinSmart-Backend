import { Router } from 'express';
import { diagnostics, diagnosticsAuth } from '../controllers/diagnosticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', diagnostics);
router.get('/auth', requireAuth, diagnosticsAuth);

export default router;

