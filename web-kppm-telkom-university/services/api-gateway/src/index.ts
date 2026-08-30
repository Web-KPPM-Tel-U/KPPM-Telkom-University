import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 4000;

const AUTH_SERVICE    = 'http://localhost:4001';
const STUDENT_SERVICE = 'http://localhost:4002';
const ADMIN_SERVICE   = 'http://localhost:4003';

// ─── Middleware ───────────────────────────────────────────────────────────────
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Global: semua request (anti-DDoS umum)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.' },
});

// Upload: untuk endpoint upload file besar
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak upload. Coba lagi dalam 1 jam.' },
});

app.use(globalLimiter);


// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: {
      authService: AUTH_SERVICE,
      studentService: STUDENT_SERVICE,
    },
  });
});

// ─── Helper: baca raw body sebagai Buffer ─────────────────────────────────────
function readRawBody(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ─── Generic Proxy Helper ─────────────────────────────────────────────────────
async function proxyRequest(
  req: Request,
  res: Response,
  targetBase: string
): Promise<void> {
  const targetUrl = `${targetBase}${req.originalUrl}`;
  const contentType = req.headers['content-type'] ?? '';
  const isMultipart = contentType.includes('multipart/form-data');

  try {
    const headers: Record<string, string> = {};

    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    let fetchBody: Buffer | string | undefined;

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (isMultipart) {
        // Multipart: baca raw bytes dan forward dengan Content-Type asli (termasuk boundary)
        const rawBuffer = await readRawBody(req);
        headers['Content-Type'] = contentType;
        fetchBody = rawBuffer;
      } else if (req.body && Object.keys(req.body).length > 0) {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(req.body);
      }
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      body: fetchBody as any, // Buffer tidak ada di DOM BodyInit, tapi valid di Node.js fetch
      signal: AbortSignal.timeout(30000),
    };

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.error(`[Gateway] Timeout proxying to ${targetUrl}`);
      res.status(504).json({ success: false, error: 'Service timeout' });
    } else {
      console.error(`[Gateway] Error proxying to ${targetUrl}:`, err.message);
      res.status(503).json({ success: false, error: 'Service unavailable' });
    }
  }
}

// ─── Proxy Routes ─────────────────────────────────────────────────────────────

// /auth/* → Auth Service (port 4001)
// Rate limiting granular ditangani langsung oleh auth-service per endpoint
app.all('/auth/*', (req: Request, res: Response) => {
  proxyRequest(req, res, AUTH_SERVICE);
});

// /student/kppm/results → Student Service — rate limit upload
app.all('/student/kppm/results', uploadLimiter, (req: Request, res: Response) => {
  proxyRequest(req, res, STUDENT_SERVICE);
});

// /student/* → Student Service (port 4002)
app.all('/student/*', (req: Request, res: Response) => {
  proxyRequest(req, res, STUDENT_SERVICE);
});

// /admin/* → Admin Service (port 4003)
app.all('/admin/*', (req: Request, res: Response) => {
  proxyRequest(req, res, ADMIN_SERVICE);
});

// /uploads/* → Student Service (port 4002) — binary-safe proxy untuk file statik
app.all('/uploads/*', async (req: Request, res: Response) => {
  const targetUrl = `${STUDENT_SERVICE}${req.originalUrl}`;
  try {
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(15000),
    });
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (err: any) {
    console.error(`[Gateway] Error fetching file ${targetUrl}:`, err.message);
    res.status(503).json({ success: false, error: 'File tidak tersedia' });
  }
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found on API Gateway' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[API Gateway] Running at http://localhost:${PORT}`);
  console.log(`   → /auth/*    → Auth Service    (${AUTH_SERVICE})`);
  console.log(`   → /student/* → Student Service (${STUDENT_SERVICE})`);
  console.log(`   → /admin/*   → Admin Service   (${ADMIN_SERVICE})`);
  console.log(`   → /health    → Health check\n`);
});
