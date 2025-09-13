import { Router } from 'express';
import auth from './auth.js';
import accounts from './accounts.js';
import transactions from './transactions.js';
import statements from './statements.js';
import budgets from './budgets.js';
import analytics from './analytics.js';
import cards from './cards.js';
import transfers from './transfers.js';
import { requireAuth } from '../middleware/auth.js';
import { forecastMonthEnd } from '../controllers/forecastController.js';
import notifications from './notifications.js';

const router = Router();

router.use('/auth', auth);
router.use('/accounts', accounts);
router.use('/transactions', transactions);
router.use('/statements', statements);
router.use('/budgets', budgets);
router.use('/analytics', analytics);
router.use('/cards', cards);
router.use('/transfers', transfers);
router.get('/analytics/forecast', requireAuth, forecastMonthEnd);
router.use('/notifications', notifications);

export default router;
