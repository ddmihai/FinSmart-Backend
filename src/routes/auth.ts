import { Router } from 'express';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import { login, logout, me, refresh, signup } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/signup',
  body('email').isEmail(),
  body('name').isLength({ min: 1 }),
  body('password').isLength({ min: 8 }),
  handleValidation,
  signup);

router.post('/login',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  handleValidation,
  login);

router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', requireAuth, me);

export default router;

