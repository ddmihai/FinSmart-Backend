import { Router } from 'express';
import { query } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();
router.get('/', requireAuth, query('accountId').isMongoId(), handleValidation, getAnalytics);
export default router;

