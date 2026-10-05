const jwt = require('jsonwebtoken');

// Tinitingnan kung may valid na token
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Kailangan mag-login' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role, name: payload.name };
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Expired o hindi valid ang session. Mag-login ulit.' });
  }
};

// Tinitingnan kung pasok ang role
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Wala kang pahintulot sa aksyong ito' });
  }
  next();
};

module.exports = { authenticate, requireRole };