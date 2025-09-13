import { Router } from 'express';
import { query } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { categoryInsights } from '../controllers/insightsController.js';

const router = Router();
router.get('/category', requireAuth, query('accountId').isMongoId(), handleValidation, categoryInsights);

export default router;

