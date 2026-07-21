const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const config = require('./src/config/env');
const { helmetConfig } = require('./src/middleware/helmetConfig');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const authRoutes = require('./src/routes/auth');
const claimRoutes = require('./src/routes/claim');
const rewardRoutes = require('./src/routes/reward');
const adminRoutes = require('./src/routes/admin');

const app = express();

app.use(helmet(helmetConfig));
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow no-origin (mobile/curl/same-origin) or whitelisted
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('CORS: origin not allowed'));
    }
  },
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));
if (config.nodeEnv !== 'test') app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);

// SPA fallback for page routes
const pages = ['/', '/scratch', '/reward', '/claimed', '/admin'];
pages.forEach(p => {
  app.get(p, (req, res) => res.sendFile(path.join(__dirname, 'public', p === '/' ? 'index.html' : `${p.slice(1)}.html`)));
});

app.post('/api/debug-claim', async (req, res) => {
  try {
    const { processNewClaim } = require('./src/services/claimService');
    const claim = await processNewClaim('DEBUG-TEST-' + Date.now(), {
      ip: req.ip, fingerprint: null, userAgent: null
    });
    res.json({ success: true, claim });
  } catch (e) {
    res.json({ success: false, error: e.message, status: e.status, stack: e.stack });
  }
});

app.get('/api/debug', async (req, res) => {
  try {
    const supabase = require('./src/config/supabase');
    const { data, error } = await supabase.from('rewards').select('id').limit(1);
    res.json({
      node_env: process.env.NODE_ENV,
      has_supabase_url: !!process.env.SUPABASE_URL,
      has_supabase_key: !!process.env.SUPABASE_SERVICE_KEY,
      has_jwt: !!process.env.JWT_SECRET,
      supabase_ok: !error,
      supabase_error: error?.message || null,
      rewards_count: data?.length ?? null,
    });
  } catch (e) {
    res.json({ crash: e.message, stack: e.stack });
  }
});

app.use(errorHandler);

if (config.nodeEnv !== 'production') {
  app.listen(config.port, () => logger.info(`PartSmart running on port ${config.port} [${config.nodeEnv}]`));
}

module.exports = app;
