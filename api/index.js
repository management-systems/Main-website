const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const fs = require('fs');

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
let db;
async function getDb() {
  if (db) return db;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db('managementsystems');
  return db;
}

// Config
const config = {
  company: 'Management Systems',
  email: 'admin@managementsystems.in',
  phone: '9992662555',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@managementsystems.in',
    password: process.env.ADMIN_PASSWORD || 'Rewari@123'
  },
  jwtSecret: process.env.JWT_SECRET || 'ms_secret_key_2024_secure',
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: process.env.SMTP_USER || 'admin@managementsystems.in',
    pass: process.env.SMTP_PASS || ''
  }
};

// Auth middleware
function auth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Email transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: { user: config.smtp.user, pass: config.smtp.pass }
});

// ===== PUBLIC API =====

// Get site details
app.get('/api/details', async (req, res) => {
  try {
    const db = await getDb();
    const details = await db.collection('settings').findOne({ key: 'details' });
    res.json(details?.value || { name: '', email: config.email, phone: config.phone });
  } catch { res.json({ name: '', email: config.email, phone: config.phone }); }
});

// Get discounts
app.get('/api/discounts', async (req, res) => {
  try {
    const db = await getDb();
    const discounts = await db.collection('settings').findOne({ key: 'discounts' });
    res.json(discounts?.value || {});
  } catch { res.json({}); }
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const db = await getDb();

  // Check duplicate
  const isDuplicate = await db.collection('submissions').findOne({
    name, email, phone: phone || '', service: service || '', message
  });
  if (isDuplicate) {
    return res.status(409).json({ error: 'You have already submitted this exact inquiry. Please modify your message to submit again.' });
  }

  const entry = { name, email, phone: phone || '', service: service || '', message, submittedAt: new Date().toISOString(), status: 'new' };
  await db.collection('submissions').insertOne(entry);

  // Send email
  try {
    await transporter.sendMail({
      from: `"Management Systems" <${config.smtp.user}>`,
      to: config.email,
      subject: `New Inquiry: ${service || 'General'} — ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table style="border-collapse:collapse;width:100%;max-width:500px;">
          <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${name}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${phone || 'Not provided'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Service</td><td style="padding:8px;">${service || 'Not selected'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Message</td><td style="padding:8px;">${message}</td></tr>
        </table>
      `
    });
  } catch (err) { console.error('Email failed:', err.message); }

  res.status(200).json({ success: true, message: 'Thank you! We will get back to you shortly.' });
});

// ===== ADMIN =====

// Admin login page
app.get('/admin', (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    try { jwt.verify(token, config.jwtSecret); return res.redirect('/admin/dashboard'); } catch {}
  }
  const html = fs.readFileSync(path.join(__dirname, '../public/admin/login.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Admin login POST
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === config.admin.email && password === config.admin.password) {
    const token = jwt.sign({ email }, config.jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin dashboard page
app.get('/admin/dashboard', auth, (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, '../public/admin/dashboard.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Admin: Get submissions
app.get('/admin/api/submissions', auth, async (req, res) => {
  const db = await getDb();
  const submissions = await db.collection('submissions').find().toArray();
  res.json(submissions);
});

// Admin: Update submission
app.put('/admin/api/submissions/:id', auth, async (req, res) => {
  const db = await getDb();
  const { ObjectId } = require('mongodb');
  const result = await db.collection('submissions').findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: { ...req.body, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  res.json({ success: true, data: result });
});

// Admin: Delete submission
app.delete('/admin/api/submissions/:id', auth, async (req, res) => {
  const db = await getDb();
  const { ObjectId } = require('mongodb');
  await db.collection('submissions').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ success: true });
});

// Admin: Get details
app.get('/admin/api/details', auth, async (req, res) => {
  const db = await getDb();
  const details = await db.collection('settings').findOne({ key: 'details' });
  res.json(details?.value || { name: '', email: config.email, phone: config.phone });
});

// Admin: Update details
app.put('/admin/api/details', auth, async (req, res) => {
  const db = await getDb();
  const { name, email, phone } = req.body;
  const value = { name: name || '', email: email || '', phone: phone || '' };
  await db.collection('settings').updateOne({ key: 'details' }, { $set: { value } }, { upsert: true });
  res.json({ success: true, data: value });
});

// Admin: Get discounts
app.get('/admin/api/discounts', auth, async (req, res) => {
  const db = await getDb();
  const discounts = await db.collection('settings').findOne({ key: 'discounts' });
  res.json(discounts?.value || {});
});

// Admin: Update discounts
app.put('/admin/api/discounts', auth, async (req, res) => {
  const db = await getDb();
  await db.collection('settings').updateOne({ key: 'discounts' }, { $set: { value: req.body } }, { upsert: true });
  res.json({ success: true, data: req.body });
});

// Admin: Logout
app.get('/admin/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/admin');
});

// Catch-all: serve index.html
app.get('*', (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = app;
