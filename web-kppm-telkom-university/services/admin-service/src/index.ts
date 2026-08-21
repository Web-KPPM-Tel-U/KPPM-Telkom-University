import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import adminRoutes from './routes/adminRoutes';

const app = express();
const PORT = process.env.PORT || 4003;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'admin-service',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/admin', adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found on Admin Service' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[Admin Service] Running at http://localhost:${PORT}`);
  console.log(`   Routes:`);
  console.log(`   GET  /admin/stats`);
  console.log(`   GET  /admin/lecturers`);
  console.log(`   GET  /admin/students`);
  console.log(`   GET  /admin/semesters`);
  console.log(`   POST /admin/inject/students`);
  console.log(`   POST /admin/inject/lecturers\n`);
});
