// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains email or userId
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
