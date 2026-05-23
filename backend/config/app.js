module.exports = {
  port: process.env.PORT || 9000,
  company: 'Management Systems',
  domain: 'managementsystems.in',
  email: 'admin@managementsystems.in',
  phone: '9992662555',
  admin: {
    email: 'admin@managementsystems.in',
    password: 'Rewari@123'
  },
  jwtSecret: process.env.JWT_SECRET || 'ms_secret_key_2024_secure',
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'admin@managementsystems.in',
    pass: process.env.SMTP_PASS || 'YOUR_APP_PASSWORD_HERE'
  }
};
