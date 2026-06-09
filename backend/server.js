const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config/app');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/contact', contactRoutes);
app.use('/admin', adminRoutes);

// Public API: site details
app.get('/api/details', async (req, res) => {
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    const { getDb } = require('./config/db');
    const db = await getDb();
    if (db) {
      const details = await db.collection('settings').findOne({ type: 'details' });
      return res.json(details || { name: '', email: config.email, phone: config.phone });
    }
  }
  const fs = require('fs');
  const detailsFile = path.join(__dirname, 'data/details.json');
  if (fs.existsSync(detailsFile)) {
    return res.json(JSON.parse(fs.readFileSync(detailsFile, 'utf-8')));
  }
  res.json({ name: '', email: config.email, phone: config.phone });
});

// Public API: discounts
app.get('/api/discounts', async (req, res) => {
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    const { getDb } = require('./config/db');
    const db = await getDb();
    if (db) {
      const discounts = await db.collection('settings').findOne({ type: 'discounts' });
      if (discounts) { delete discounts._id; delete discounts.type; }
      return res.json(discounts || {});
    }
  }
  const fs = require('fs');
  const discountsFile = path.join(__dirname, 'data/discounts.json');
  if (fs.existsSync(discountsFile)) {
    return res.json(JSON.parse(fs.readFileSync(discountsFile, 'utf-8')));
  }
  res.json({});
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(config.port, () => {
  console.log(`${config.company} server running on port ${config.port}`);
});
