const jwt = require('jsonwebtoken');

// JWT token used to checks and verifies the credentials
function authenticateToken(req, res, next) {
  // get token from Authorization header --> "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;