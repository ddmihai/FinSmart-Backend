import { Router } from 'express';
import { body, query } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { addExpense, addIncome, deposit, listTransactions, transfer } from '../controllers/transactionController.js';

const router = Router();
router.use(requireAuth);

router.post('/income',
  body('accountId').isMongoId(),
  body('amount').isInt({ min: 1 }),
  body('name').isString(),
  body('recurring').optional().isBoolean(),
  body('interval').optional().isIn(['daily', 'weekly', 'monthly']),
  handleValidation,
  addIncome);

router.post('/expense',
  body('accountId').isMongoId(),
  body('amount').isInt({ min: 1 }),
  body('name').isString(),
  body('cardId').optional().isMongoId(),
  handleValidation,
  addExpense);

router.post('/deposit',
  body('accountId').isMongoId(),
  body('amount').isInt({ min: 1 }),
  body('method').optional().isString(),
  handleValidation,
  deposit);

router.post('/transfer',
  body('fromAccountId').isMongoId(),
  body('toName').isString(),
  body('toSortCode').isString(),
  body('toAccountNumber').isString(),
  body('amount').isInt({ min: 1 }),
  body('reference').optional().isString(),
  handleValidation,
  transfer);

router.get('/',
  query('accountId').isMongoId(),
  handleValidation,
  listTransactions);

export default router;
