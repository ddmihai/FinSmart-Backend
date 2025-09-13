import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import { getLogoutPolicy, setLogoutPolicy } from '../controllers/settingsController.js';

const router = Router();
router.use(requireAuth);

router.get('/logout-policy', getLogoutPolicy);
router.post('/logout-policy', body('policy').isIn(['immediate','onClose','idle30m']), handleValidation, setLogoutPolicy);

export default router;

