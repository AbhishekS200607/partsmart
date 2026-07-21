const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const config = require('./src/config/env');
const { helmetConfig } = require('./src/middleware/helmetConfig');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth');
const claimRoutes = require('./src/routes/claim');
const rewardRoutes = require('./src/routes/reward');
const adminRoutes = require('./src/routes/admin');

const app = express();

app.use(helmet(helmetConfig));

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
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

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);

const pages = ['/', '/scratch', '/reward', '/claimed', '/admin'];
pages.forEach(p => {
  app.get(p, (req, res) => res.sendFile(path.join(__dirname, 'public', p === '/' ? 'index.html' : `${p.slice(1)}.html`)));
});

app.use(errorHandler);

if (config.nodeEnv !== 'production') {
  app.listen(config.port, () => console.log(`PartSmart running on port ${config.port}`));
}

module.exports = app;
