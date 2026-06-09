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

// File helpers
function readJson(file, fallback) {
  const fp = path.join(dataDir, file);
  if (!fs.existsSync(fp)) return fallback;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}
function writeJson(file, data) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
}

// --- PAGE ROUTES ---
router.get('/', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try { jwt.verify(token, config.jwtSecret); return res.redirect('/admin/dashboard'); } catch {}
  }
  res.sendFile(path.join(__dirname, '../../frontend/admin/login.html'));
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === config.admin.email && password === config.admin.password) {
    const token = jwt.sign({ email }, config.jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/dashboard', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/dashboard.html'));
});
router.get('/submissions', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/submissions.html'));
});
router.get('/submissions/:id', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/submission-detail.html'));
});
router.get('/customers', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/customers.html'));
});
router.get('/customers/:id', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/customer-detail.html'));
});
router.get('/settings', auth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/settings.html'));
});
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin');
});

// --- SUBMISSIONS API ---
router.get('/api/submissions', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) return res.json(await db.collection('submissions').find().toArray());
  }
  res.json(readJson('submissions.json', []));
});

router.put('/api/submissions/:index', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const all = await db.collection('submissions').find().toArray();
      const idx = parseInt(req.params.index);
      if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
      const updated = { ...all[idx], ...req.body, updatedAt: new Date().toISOString() };
      delete updated._id;
      await db.collection('submissions').replaceOne({ _id: all[idx]._id }, updated);
      return res.json({ success: true, data: updated });
    }
  }
  const all = readJson('submissions.json', []);
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
  all[idx] = { ...all[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeJson('submissions.json', all);
  res.json({ success: true, data: all[idx] });
});

router.delete('/api/submissions/:index', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const all = await db.collection('submissions').find().toArray();
      const idx = parseInt(req.params.index);
      if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
      await db.collection('submissions').deleteOne({ _id: all[idx]._id });
      return res.json({ success: true });
    }
  }
  const all = readJson('submissions.json', []);
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
  all.splice(idx, 1);
  writeJson('submissions.json', all);
  res.json({ success: true });
});

// --- CUSTOMERS API ---
router.get('/api/customers', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) return res.json(await db.collection('customers').find().toArray());
  }
  res.json(readJson('customers.json', []));
});

router.post('/api/customers', auth, async (req, res) => {
  const customer = { ...req.body, convertedAt: req.body.convertedAt || new Date().toISOString(), remarks: req.body.remarks || [], purchases: req.body.purchases || [] };
  if (isVercel) {
    const db = await getDb();
    if (db) { await db.collection('customers').insertOne(customer); return res.json({ success: true, data: customer }); }
  }
  const all = readJson('customers.json', []);
  all.push(customer);
  writeJson('customers.json', all);
  res.json({ success: true, data: customer });
});

router.put('/api/customers/:index', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const all = await db.collection('customers').find().toArray();
      const idx = parseInt(req.params.index);
      if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
      const updated = { ...all[idx], ...req.body, updatedAt: new Date().toISOString() };
      delete updated._id;
      await db.collection('customers').replaceOne({ _id: all[idx]._id }, updated);
      return res.json({ success: true, data: updated });
    }
  }
  const all = readJson('customers.json', []);
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
  all[idx] = { ...all[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeJson('customers.json', all);
  res.json({ success: true, data: all[idx] });
});

router.delete('/api/customers/:index', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const all = await db.collection('customers').find().toArray();
      const idx = parseInt(req.params.index);
      if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
      await db.collection('customers').deleteOne({ _id: all[idx]._id });
      return res.json({ success: true });
    }
  }
  const all = readJson('customers.json', []);
  const idx = parseInt(req.params.index);
  if (idx < 0 || idx >= all.length) return res.status(404).json({ error: 'Not found' });
  all.splice(idx, 1);
  writeJson('customers.json', all);
  res.json({ success: true });
});

// --- SETTINGS API ---
router.get('/api/details', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const d = await db.collection('settings').findOne({ type: 'details' });
      return res.json(d || { name: '', email: config.email, phone: config.phone });
    }
  }
  res.json(readJson('details.json', { name: '', email: config.email, phone: config.phone }));
});

router.put('/api/details', auth, async (req, res) => {
  const { name, email, phone } = req.body;
  const details = { name: name || '', email: email || '', phone: phone || '' };
  if (isVercel) {
    const db = await getDb();
    if (db) { await db.collection('settings').updateOne({ type: 'details' }, { $set: { ...details, type: 'details' } }, { upsert: true }); return res.json({ success: true, data: details }); }
  }
  writeJson('details.json', details);
  res.json({ success: true, data: details });
});

router.get('/api/discounts', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) {
      const d = await db.collection('settings').findOne({ type: 'discounts' });
      if (d) { delete d._id; delete d.type; }
      return res.json(d || {});
    }
  }
  res.json(readJson('discounts.json', {}));
});

router.put('/api/discounts', auth, async (req, res) => {
  if (isVercel) {
    const db = await getDb();
    if (db) { await db.collection('settings').updateOne({ type: 'discounts' }, { $set: { ...req.body, type: 'discounts' } }, { upsert: true }); return res.json({ success: true, data: req.body }); }
  }
  writeJson('discounts.json', req.body);
  res.json({ success: true, data: req.body });
});

module.exports = router;
