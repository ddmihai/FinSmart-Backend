import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { deleteBudget, getBudgetUsage, listBudgets, setBudget, updateBudget } from '../controllers/budgetController.js';
import { param, body } from 'express-validator';

const router = Router();
router.use(requireAuth);

router.post('/',
  body('category').isString().isLength({ min: 1, max: 64 }).trim().escape(),
  body('limit').isInt({ min: 0, max: 100000000 }),
  handleValidation,
  setBudget
);
router.get('/usage', getBudgetUsage);
router.get('/', listBudgets);
router.patch('/:id',
  param('id').isMongoId(),
  body('limit').isInt({ min: 0, max: 100000000 }),
  handleValidation,
  updateBudget
);
router.delete('/:id', param('id').isMongoId(), handleValidation, deleteBudget);

export default router;
