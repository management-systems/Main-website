const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const config = require('../config/app');

const SUBMISSIONS_FILE = path.join(__dirname, '../data/submissions.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Load existing submissions
function getSubmissions() {
  if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
  return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
}

// Save submission
function saveSubmission(entry) {
  const submissions = getSubmissions();
  submissions.push(entry);
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
}

// Email transporter — configure with your SMTP credentials
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass
  }
});

// Send email notification
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

  const entry = { name, email, phone, service, message, submittedAt: new Date().toISOString() };

  // Save to file
  saveSubmission(entry);

  // Send email
  try {
    await sendEmail(entry);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  res.status(200).json({ success: true, message: 'Thank you! We will get back to you shortly.' });
};

// View all submissions (admin endpoint)
exports.getSubmissions = (req, res) => {
  const submissions = getSubmissions();
  res.json(submissions);
};
