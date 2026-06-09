const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config/app');
const { getDb } = require('../config/db');

const isVercel = process.env.VERCEL === '1';
const dataDir = path.join(__dirname, '../data');
const SUBMISSIONS_FILE = path.join(dataDir, 'submissions.json');

if (!isVercel && !fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// File-based helpers (local dev)
function getSubmissionsFromFile() {
  try {
    if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
  } catch { return []; }
}

function saveSubmissionToFile(entry) {
  try {
    const submissions = getSubmissionsFromFile();
    submissions.push(entry);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
  } catch (err) {
    console.error('Save failed:', err.message);
  }
}

// Universal helpers
async function getSubmissions() {
  if (isVercel) {
    const db = await getDb();
    if (db) return await db.collection('submissions').find().toArray();
    return [];
  }
  return getSubmissionsFromFile();
}

async function saveSubmission(entry) {
  if (isVercel) {
    const db = await getDb();
    if (db) await db.collection('submissions').insertOne(entry);
    return;
  }
  saveSubmissionToFile(entry);
}

// Email transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: { user: config.smtp.user, pass: config.smtp.pass }
});

async function sendEmail(data) {
  const mailOptions = {
    from: `"Management Systems" <${config.smtp.user}>`,
    to: config.email,
    subject: `New Inquiry: ${data.service || 'General'} — ${data.name}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${data.name}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${data.email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${data.phone || 'Not provided'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Service</td><td style="padding:8px;">${data.service || 'Not selected'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Message</td><td style="padding:8px;">${data.message}</td></tr>
      </table>
      <p style="margin-top:16px;color:#666;">Submitted at: ${data.submittedAt}</p>
    `
  };
  await transporter.sendMail(mailOptions);
}

exports.submitContact = async (req, res) => {
  const { name, email, phone, service, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const submissions = await getSubmissions();
  const isDuplicate = submissions.some(s =>
    s.name === name && s.email === email && s.phone === (phone || '') && s.service === (service || '') && s.message === message
  );
  if (isDuplicate) {
    return res.status(409).json({ error: 'You have already submitted this exact inquiry. Please modify your message to submit again.' });
  }

  const entry = { name, email, phone: phone || '', service: service || '', message, submittedAt: new Date().toISOString(), status: 'new' };

  await saveSubmission(entry);

  try { await sendEmail(entry); }
  catch (err) { console.error('Email send failed:', err.message); }

  res.status(200).json({ success: true, message: 'Thank you! We will get back to you shortly.' });
};

exports.getSubmissions = async (req, res) => {
  const submissions = await getSubmissions();
  res.json(submissions);
};
