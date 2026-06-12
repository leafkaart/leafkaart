// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const authMiddleware = async (req, res, next) => {
//     const token = req.header('Authorization');

//     if (!token) {
//         return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }

//     try {
//         const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         console.error(error);
//         res.status(400).json({ message: 'Invalid token.' });
//     }
// };

// module.exports = authMiddleware;

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const rawToken = token.replace('Bearer ', '');
        const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // For customers: check the token is still in activeTokens (logout invalidation)
        if (user.role === 'customer') {
            const sessionActive = user.activeTokens.some(t => t.token === rawToken);
            if (!sessionActive) {
                return res.status(401).json({ message: 'Session expired. Please log in again.' });
            }
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;
