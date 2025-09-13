import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listNotifications, markRead, stream } from '../controllers/notificationController.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

router.get('/', listNotifications);
router.post('/read', body('ids').isArray(), handleValidation, markRead);
router.get('/stream', stream);

export default router;

