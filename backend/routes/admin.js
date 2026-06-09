const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const config = require('../config/app');
const auth = require('../middleware/auth');
const { getDb } = require('../config/db');

const router = express.Router();
const isVercel = process.env.VERCEL === '1';
const dataDir = path.join(__dirname, '../data');
const SUBMISSIONS_FILE = path.join(dataDir, 'submissions.json');
const DETAILS_FILE = path.join(dataDir, 'details.json');
const DISCOUNTS_FILE = path.join(dataDir, 'discounts.json');

// File-based helpers (local dev)
function loadSubmissionsFile() {
  if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
}
function saveSubmissionsFile(data) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2));
}
function loadDetailsFile() {
  if (!fs.existsSync(DETAILS_FILE)) return { name: '', email: config.email, phone: config.phone };
  return JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf-8'));
}
function saveDetailsFile(data) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(DETAILS_FILE, JSON.stringify(data, null, 2));
}
function loadDiscountsFile() {
  if (!fs.existsSync(DISCOUNTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(DISCOUNTS_FILE, 'utf-8'));
}
function saveDiscountsFile(data) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(DISCOUNTS_FILE, JSON.stringify(data, null, 2));
}

// Login page
router.get('/', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      jwt.verify(token, config.jwtSecret);
      return res.redirect('/admin/dashboard');
    } catch {}
  }
  res.sendFile(path.join(__dirname, '../../frontend/admin/login.html'));
});

// Login POST
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === config.admin.email && password === config.admin.password) {
    const token = jwt.sign({ email }, config.jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Dashboard page
router.get('/dashboard', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/dashboard.html'));
});

// API: Get all submissions
router.get('/api/submissions', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const submissions = await db.collection('submissions').find().toArray();
      return res.json(submissions);
    }
  }
  res.json(loadSubmissionsFile());
});

// API: Update a submission
router.put('/api/submissions/:index', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const submissions = await db.collection('submissions').find().toArray();
      const idx = parseInt(req.params.index);
      if (idx < 0 || idx >= submissions.length) return res.status(404).json({ error: 'Not found' });
      const updated = { ...submissions[idx], ...req.body, updatedAt: new Date().toISOString() };
      delete updated._id;
      await db.collection('submissions').replaceOne({ _id: submissions[idx]._id }, updated);
      return res.json({ success: true, data: updated });
    }
  }
  const submissions = loadSubmissionsFile();
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= submissions.length) return res.status(404).json({ error: 'Not found' });
  submissions[idx] = { ...submissions[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveSubmissionsFile(submissions);
  res.json({ success: true, data: submissions[idx] });
});

// API: Delete a submission
router.delete('/api/submissions/:index', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const submissions = await db.collection('submissions').find().toArray();
      const idx = parseInt(req.params.index);
      if (idx < 0 || idx >= submissions.length) return res.status(404).json({ error: 'Not found' });
      await db.collection('submissions').deleteOne({ _id: submissions[idx]._id });
      return res.json({ success: true });
    }
  }
  const submissions = loadSubmissionsFile();
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= submissions.length) return res.status(404).json({ error: 'Not found' });
  submissions.splice(idx, 1);
  saveSubmissionsFile(submissions);
  res.json({ success: true });
});

// API: Get site details
router.get('/api/details', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const details = await db.collection('settings').findOne({ type: 'details' });
      return res.json(details || { name: '', email: config.email, phone: config.phone });
    }
  }
  res.json(loadDetailsFile());
});

// API: Update site details
router.put('/api/details', auth, async (req, res) => {
  const { name, email, phone } = req.body;
  const details = { name: name || '', email: email || '', phone: phone || '' };
  if (isVercel) {
    const db = await getDb();
    if (db) {
      await db.collection('settings').updateOne({ type: 'details' }, { $set: { ...details, type: 'details' } }, { upsert: true });
      return res.json({ success: true, data: details });
    }
  }
  saveDetailsFile(details);
  res.json({ success: true, data: details });
});

// API: Get discounts
router.get('/api/discounts', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const discounts = await db.collection('settings').findOne({ type: 'discounts' });
      if (discounts) { delete discounts._id; delete discounts.type; }
      return res.json(discounts || {});
    }
  }
  res.json(loadDiscountsFile());
});

// API: Update discounts
router.put('/api/discounts', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      await db.collection('settings').updateOne({ type: 'discounts' }, { $set: { ...req.body, type: 'discounts' } }, { upsert: true });
      return res.json({ success: true, data: req.body });
    }
  }
  saveDiscountsFile(req.body);
  res.json({ success: true, data: req.body });
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin');
});

module.exports = router;
