import { Router } from 'express';
import { query, body, param } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validate.js';
import { downloadStatement, getStatement, shareStatement, viewSharedStatement, exportStatement } from '../controllers/statementController.js';

const router = Router();

router.get('/', requireAuth, query('accountId').isMongoId(), handleValidation, getStatement);
router.get('/download', requireAuth, query('accountId').isMongoId(), handleValidation, downloadStatement);
router.get('/export', requireAuth, query('accountId').isMongoId(), handleValidation, exportStatement);
router.post('/share', requireAuth,
  body('accountId').isMongoId(),
  body('ttlHours').optional().isInt({ min: 1, max: 720 }),
  handleValidation,
  shareStatement);

router.get('/shared/:token', param('token').isString(), handleValidation, viewSharedStatement);

export default router;
