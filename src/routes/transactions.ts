import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { addExpense, addIncome, deposit, listTransactions, transfer, hideTransaction, unhideTransaction, blockMerchant, unblockMerchant, listBlockedMerchants, deleteBlockedMerchant, updateTransaction } from '../controllers/transactionController.js';

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

router.post('/:id/hide', param('id').isMongoId(), handleValidation, hideTransaction);
router.post('/:id/unhide', param('id').isMongoId(), handleValidation, unhideTransaction);
router.post('/:id/block-merchant', param('id').isMongoId(), handleValidation, blockMerchant);
router.post('/:id/unblock-merchant', param('id').isMongoId(), handleValidation, unblockMerchant);
router.get('/blocked', listBlockedMerchants);
router.delete('/blocked/:id', param('id').isMongoId(), handleValidation, deleteBlockedMerchant);
router.patch('/:id', param('id').isMongoId(), body('name').optional().isString(), body('category').optional().isString(), body('note').optional().isString(), handleValidation, updateTransaction);

export default router;
