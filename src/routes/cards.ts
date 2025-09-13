import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { freezeCard, setCardLimits, unfreezeCard, revealCard } from '../controllers/cardController.js';

const router = Router();
router.use(requireAuth);

router.post('/:cardId/freeze', param('cardId').isMongoId(), handleValidation, freezeCard);
router.post('/:cardId/unfreeze', param('cardId').isMongoId(), handleValidation, unfreezeCard);
router.post('/:cardId/limits', param('cardId').isMongoId(), body('dailyLimit').optional().isInt({ min: 0 }), body('weeklyLimit').optional().isInt({ min: 0 }), handleValidation, setCardLimits);
router.post('/:cardId/reveal', param('cardId').isMongoId(), body('password').isString(), handleValidation, revealCard);

export default router;

