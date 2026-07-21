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
app.use(cors({ origin: config.cors.origin, credentials: true }));
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

app.use(errorHandler);

app.listen(config.port, () => logger.info(`PartSmart running on port ${config.port} [${config.nodeEnv}]`));

module.exports = app;
