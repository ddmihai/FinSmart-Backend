import { Router } from 'express';
import { body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { cancelRecurringTransfer, cancelScheduledPayment, createRecurringTransfer, immediateTransfer, listRecurringTransfers, listScheduledPayments, schedulePayment } from '../controllers/transferController.js';
import { getTransferLimit, setTransferLimit } from '../controllers/transferController.js';

const router = Router();
router.use(requireAuth);

router.post('/send',
  body('fromAccountId').isMongoId(),
  body('toName').isString(),
  body('toSortCode').isString(),
  body('toAccountNumber').isString(),
  body('amount').isInt({ min: 1 }),
  body('reference').optional().isString(),
  handleValidation,
  immediateTransfer);

router.post('/recurring',
  body('fromAccountId').isMongoId(),
  body('toName').isString(),
  body('toSortCode').isString(),
  body('toAccountNumber').isString(),
  body('amount').isInt({ min: 1 }),
  body('monthlyDay').isInt({ min: 1, max: 28 }),
  body('reference').optional().isString(),
  handleValidation,
  createRecurringTransfer);

router.get('/recurring', listRecurringTransfers);
router.post('/recurring/:id/cancel', param('id').isMongoId(), handleValidation, cancelRecurringTransfer);

router.post('/scheduled',
  body('fromAccountId').isMongoId(),
  body('toName').isString(),
  body('toSortCode').isString(),
  body('toAccountNumber').isString(),
  body('amount').isInt({ min: 1 }),
  body('runAt').isISO8601(),
  body('reference').optional().isString(),
  handleValidation,
  schedulePayment);

router.get('/scheduled', listScheduledPayments);
router.post('/scheduled/:id/cancel', param('id').isMongoId(), handleValidation, cancelScheduledPayment);

router.get('/limit', getTransferLimit);
router.post('/limit', body('dailyMax').isInt({ min: 0 }), handleValidation, setTransferLimit);

export default router;
