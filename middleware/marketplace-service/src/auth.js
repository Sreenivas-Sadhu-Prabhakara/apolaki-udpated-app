import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

export const requireMarketplaceManager = (req, res, next) => {
  // adminScope is set during admin-service login
  // superadmin always has access
  const isManager = req.user.adminScope === 'superadmin' || 
                    (req.user.adminScope === 'admin' && req.user.role === 'admin');
  
  // The user explicitly mentioned "Earning Ern" and "Contractor Kyle" should not be able to edit.
  // We assume these are 'customer' or 'dealer' roles.
  
  if (!isManager) {
    return res.status(403).json({ 
      success: false, 
      error: 'Marketplace Management privileges required' 
    });
  }
  next();
};
