import { Router } from 'express';
import { getProfile, getDashboard, changePassword } from '../controllers/studentController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Semua route student membutuhkan JWT yang valid
router.get('/profile', verifyToken, getProfile);
router.get('/dashboard', verifyToken, getDashboard);
router.patch('/change-password', verifyToken, changePassword);

export default router;

