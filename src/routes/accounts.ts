import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { createAccount, myAccounts, myCards, replaceCard } from '../controllers/accountController.js';

const router = Router();
router.use(requireAuth);

router.get('/', myAccounts);
router.post('/', body('type').optional().isIn(['Basic', 'Credit', 'Platinum', 'Gold']), handleValidation, createAccount);
router.get('/cards', myCards);
router.post('/:accountId/replace-card', param('accountId').isMongoId(), handleValidation, replaceCard);

export default router;

