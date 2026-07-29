import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 4001;

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
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found on Auth Service' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[Auth Service] Running at http://localhost:${PORT}`);
  console.log(`   Routes:`);
  console.log(`   POST /auth/student/login`);
  console.log(`   POST /auth/lecturer/login`);
  console.log(`   POST /auth/mentor/send-otp`);
  console.log(`   POST /auth/mentor/verify-otp`);
  console.log(`   POST /auth/logout\n`);
});
