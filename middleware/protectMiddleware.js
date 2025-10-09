import jwt from 'jsonwebtoken';
import User from '../module/auth-module.js';

export const protect = async (req, res, next) => {
    try {
        let token = req.cookies?.token;

        // Fallback to Authorization header (e.g., from Postman)
        if (!token && req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token verification failed' });
    }
};
