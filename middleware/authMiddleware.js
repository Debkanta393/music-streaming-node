import jwt from 'jsonwebtoken';
import User from '../module/auth-module.js';

const authMiddleware = async (req, res, next) => {
  // Try cookie first
  let token = req.cookies?.token;

  // Fallback to Authorization header (e.g., from Postman)
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authMiddleware