const jwt = require('jsonwebtoken');
const config = require('../config/app');

module.exports = (req, res, next) => {
  const token = req.cookies?.token;
  const isApi = req.path.startsWith('/api/');
  if (!token) {
    return isApi ? res.status(401).json({ error: 'Unauthorized' }) : res.redirect('/admin');
  }
  try {
    req.admin = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.clearCookie('token');
    return isApi ? res.status(401).json({ error: 'Unauthorized' }) : res.redirect('/admin');
  }
};
