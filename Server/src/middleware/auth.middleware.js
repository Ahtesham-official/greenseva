const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    if (!token) {
      return res.status(401).json({ err: true, message: 'Access denied. No token provided.' });
    }
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'greenseva_secret_key_2026';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ err: true, message: 'Invalid or expired token.', error: err.message });
  }
};

module.exports = authMiddleware;