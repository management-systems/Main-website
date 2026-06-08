const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const config = require('../config/app');
const auth = require('../middleware/auth');

const router = express.Router();
const isVercel = process.env.VERCEL === '1';
const dataDir = isVercel ? '/tmp' : path.join(__dirname, '../data');
const SUBMISSIONS_FILE = path.join(dataDir, 'submissions.json');
const DETAILS_FILE = path.join(dataDir, 'details.json');
const DISCOUNTS_FILE = path.join(dataDir, 'discounts.json');

function loadDetails() {
  if (!fs.existsSync(DETAILS_FILE)) {
    return { name: '', email: config.email, phone: config.phone };
  }
  return JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf-8'));
}

function saveDetails(data) {
  const dir = path.dirname(DETAILS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DETAILS_FILE, JSON.stringify(data, null, 2));
}

function loadDiscounts() {
  if (!fs.existsSync(DISCOUNTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(DISCOUNTS_FILE, 'utf-8'));
}

function saveDiscounts(data) {
  const dir = path.dirname(DISCOUNTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DISCOUNTS_FILE, JSON.stringify(data, null, 2));
}

function loadSubmissions() {
  if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
}

function saveSubmissions(data) {
  const dir = path.dirname(SUBMISSIONS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2));
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
router.get('/api/submissions', auth, (req, res) => {
  res.json(loadSubmissions());
});

// API: Update a submission (mark status, add notes)
router.put('/api/submissions/:index', auth, (req, res) => {
  const submissions = loadSubmissions();
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= submissions.length) return res.status(404).json({ error: 'Not found' });
  submissions[idx] = { ...submissions[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveSubmissions(submissions);
  res.json({ success: true, data: submissions[idx] });
});

// API: Delete a submission
router.delete('/api/submissions/:index', auth, (req, res) => {
  const submissions = loadSubmissions();
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= submissions.length) return res.status(404).json({ error: 'Not found' });
  submissions.splice(idx, 1);
  saveSubmissions(submissions);
  res.json({ success: true });
});

// API: Get site details
router.get('/api/details', auth, (req, res) => {
  res.json(loadDetails());
});

// API: Update site details
router.put('/api/details', auth, (req, res) => {
  const { name, email, phone } = req.body;
  const details = { name: name || '', email: email || '', phone: phone || '' };
  saveDetails(details);
  res.json({ success: true, data: details });
});

// API: Get discounts
router.get('/api/discounts', auth, (req, res) => {
  res.json(loadDiscounts());
});

// API: Update discounts
router.put('/api/discounts', auth, (req, res) => {
  saveDiscounts(req.body);
  res.json({ success: true, data: req.body });
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin');
});

module.exports = router;
