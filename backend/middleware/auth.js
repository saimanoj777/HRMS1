require('dotenv').config();
const jwt = require('jsonwebtoken');
const { logAction } = require('../db');

const SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // { userId, orgId }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};