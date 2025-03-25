const Admin = require('../models/adminModel');
const Seller = require('../models/Seller');
const Rider = require('../models/Rider');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Admin Controllers
const adminController = {
  // Admin Authentication
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const admin = await Admin.findOne({ email });

      if (!admin || !(await admin.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!admin.isActive) {
        return res.status(401).json({ error: 'Admin account is deactivated' });
      }

      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
        expiresIn: '24h'
      });

      res.json({
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Seller Management
  async addSeller(req, res) {
    try {
      const newSeller = new Seller(req.body);
      await newSeller.save();
      res.status(201).json(newSeller);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteSeller(req, res) {
    try {
      await Seller.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Seller deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Rider Management
  async addRider(req, res) {
    try {
      const newRider = new Rider(req.body);
      await newRider.save();
      res.status(201).json(newRider);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async deleteRider(req, res) {
    try {
      await Rider.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Rider deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Order Assignment
  async assignOrder(req, res) {
    try {
      const { orderId, riderId } = req.body;
      const order = await Order.findByIdAndUpdate(
        orderId,
        { riderId, status: 'assigned' },
        { new: true }
      );
      res.status(200).json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = adminController; 