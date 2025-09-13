import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { createGoal, depositToGoal, listGoals } from '../controllers/goalController.js';

const router = Router();
router.use(requireAuth);

router.get('/', listGoals);
router.post('/', body('name').isString().isLength({ min: 2 }), body('target').isInt({ min: 0 }), handleValidation, createGoal);
router.post('/:id/deposit', param('id').isMongoId(), body('accountId').isMongoId(), body('amount').isInt({ min: 1 }), handleValidation, depositToGoal);

export default router;

