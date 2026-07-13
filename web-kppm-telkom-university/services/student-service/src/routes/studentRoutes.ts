import { Router } from 'express';
import { getProfile, getDashboard } from '../controllers/studentController';
import { submitRegistration, getRegistrations, getRegistrationDetail, getLecturers, upload } from '../controllers/kppmController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// ─── Student Routes ───────────────────────────────────────────────────────────
router.get('/profile',   verifyToken, getProfile);
router.get('/dashboard', verifyToken, getDashboard);

// ─── KPPM Registration Routes ─────────────────────────────────────────────────
// POST   /student/kppm/register           — submit form pendaftaran KPPM (dengan upload file)
// GET    /student/kppm/registrations      — riwayat pendaftaran mahasiswa
// GET    /student/kppm/registrations/:id  — detail satu pendaftaran
router.post('/kppm/register',           verifyToken, upload.single('surat_toss'), submitRegistration);
router.get('/kppm/registrations',       verifyToken, getRegistrations);
router.get('/kppm/registrations/:id',   verifyToken, getRegistrationDetail);
router.get('/lecturers',                verifyToken, getLecturers);

export default router;
