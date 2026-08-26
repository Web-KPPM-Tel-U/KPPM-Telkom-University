import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'internship_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ─── Test connection on startup ──────────────────────────────────────────────
pool.getConnection()
  .then((conn) => {
    console.log('[Admin Service] Database connected successfully');
    conn.release();
  })
  .catch((err) => {
    console.error('[Admin Service] Database connection failed:', err.message);
  });

export default pool;
