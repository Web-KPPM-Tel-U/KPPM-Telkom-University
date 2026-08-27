import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import studentRoutes from './routes/studentRoutes';

const app = express();
const PORT = process.env.PORT || 4002;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// ─── Rate Limiter ─────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' },
});
app.use(apiLimiter);

// ─── Static Files (Uploaded Documents) ───────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'student-service',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/student', studentRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found on Student Service' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[Student Service] Running at http://localhost:${PORT}`);
  console.log(`   Routes:`);
  console.log(`   GET  /student/profile                 (requires JWT)`);
  console.log(`   GET  /student/dashboard               (requires JWT)`);
  console.log(`   POST /student/kppm/register           (requires JWT, multipart/form-data)`);
  console.log(`   GET  /student/kppm/registrations      (requires JWT)`);
  console.log(`   GET  /student/kppm/registrations/:id  (requires JWT)\n`);
});
