const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Seller = require('../models/sellerModel');
const Admin = require('../models/adminModel');

// buyer auth
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No auth token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
       
        // Fetch complete user data
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Please authenticate' });
    }
};

const authenticateSeller = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No auth token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        
        // Fetch complete seller data
        const seller = await Seller.findById(decoded.id);
        if (!seller) {
            return res.status(401).json({ error: 'Seller not found' });
        }

        req.seller = seller;
        next();
    } catch (error) {
        console.error('Seller auth error:', error);
        res.status(401).json({ error: 'Please authenticate as seller' });
    }
};

const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No auth token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        
        // Fetch complete admin data
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ error: 'Admin not found' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({ error: 'Please authenticate as admin' });
    }
};

module.exports = { auth, authenticateSeller, authenticateAdmin }; 