import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { getBudgetUsage, setBudget } from '../controllers/budgetController.js';

const router = Router();
router.use(requireAuth);

router.post('/', body('category').isString(), body('limit').isInt({ min: 0 }), handleValidation, setBudget);
router.get('/usage', getBudgetUsage);

export default router;

